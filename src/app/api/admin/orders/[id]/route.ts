import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'
import { sendEmail, orderConfirmationEmail } from '@/lib/email'



export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const adminDb = getServerSupabase()
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const action = String(body.action)

  const { data: order, error: oErr } = await adminDb
    .from('orders')
    .select('*, user:profiles!orders_user_id_fkey(id, email, full_name), items:order_items(id, product_id, variant_id, product_name, variant_name, quantity)')
    .eq('id', id)
    .single()
  if (oErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const o = order as any
  if (['cancelled', 'refunded'].includes(o.status)) return NextResponse.json({ error: `Order is ${o.status}` }, { status: 400 })

  if (action === 'deliver') {
    const content = String(body.delivery_content || '').trim()
    if (!content) return NextResponse.json({ error: 'Delivery content (code/account) is required' }, { status: 400 })

    // Optional: remaining stock for manual products (admin sets stock after delivery)
    const rawRemaining = body.remaining_stock
    const hasRemaining = rawRemaining !== undefined && rawRemaining !== null && String(rawRemaining).trim() !== ''
    let remainingStock: number | null = null
    if (hasRemaining) {
      remainingStock = Number(rawRemaining)
      if (!Number.isFinite(remainingStock) || remainingStock < 0) return NextResponse.json({ error: 'Remaining stock must be a number >= 0' }, { status: 400 })
      remainingStock = Math.floor(remainingStock)
    }

    // Store delivery content in inventory_items linked to the order
    const firstItem = o.items?.[0]
    const { error: invErr } = await adminDb.from('inventory_items').insert({
      id: generateId(),
      product_id: firstItem?.product_id,
      variant_id: firstItem?.variant_id || null,
      product_data: { delivery: content },
      status: 'sold',
      sold_at: new Date().toISOString(),
      order_id: id,
    } as never)
    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

    // For manual delivery: update remaining stock (quantity left)
    // If admin provided remaining_stock, set it directly; otherwise auto-decrement by ordered quantity
    try {
      // Fetch product/variant to decide where to apply stock
      if (firstItem?.product_id) {
        const { data: prod } = await adminDb.from('products').select('id, stock, delivery_type').eq('id', firstItem.product_id).single()
        const isManual = prod && ((prod as any).delivery_type === 'manual' || (prod as any).delivery_type === 'manual_delivery')
        if (isManual) {
          if (firstItem.variant_id) {
            const { data: v } = await adminDb.from('product_variants').select('id, stock').eq('id', firstItem.variant_id).single()
            if (v) {
              const current = Number((v as any).stock ?? 0)
              const orderedQty = Number(firstItem.quantity ?? 1)
              const newStock = hasRemaining ? remainingStock! : Math.max(0, current - orderedQty)
              await adminDb.from('product_variants').update({ stock: newStock, updated_at: new Date().toISOString() } as never).eq('id', firstItem.variant_id)
            }
          } else {
            const current = Number((prod as any).stock ?? 0)
            const orderedQty = Number(firstItem.quantity ?? 1)
            const newStock = hasRemaining ? remainingStock! : Math.max(0, current - orderedQty)
            await adminDb.from('products').update({ stock: newStock, updated_at: new Date().toISOString() } as never).eq('id', firstItem.product_id)
          }
          // Also handle additional items if order has multiple items
          if (o.items && o.items.length > 1) {
            for (let idx = 1; idx < o.items.length; idx++) {
              const it: any = o.items[idx]
              if (!it.product_id) continue
              const { data: p2 } = await adminDb.from('products').select('id, delivery_type, stock').eq('id', it.product_id).single()
              if (!p2 || !((p2 as any).delivery_type === 'manual' || (p2 as any).delivery_type === 'manual_delivery')) continue
              if (it.variant_id) {
                const { data: vv } = await adminDb.from('product_variants').select('id, stock').eq('id', it.variant_id).single()
                if (vv) {
                  const cur = Number((vv as any).stock ?? 0)
                  const q = Number(it.quantity ?? 1)
                  // For extra items we auto-decrement (no per-item remaining input)
                  const ns = Math.max(0, cur - q)
                  await adminDb.from('product_variants').update({ stock: ns } as never).eq('id', it.variant_id)
                }
              } else {
                const cur = Number((p2 as any).stock ?? 0)
                const q = Number(it.quantity ?? 1)
                const ns = Math.max(0, cur - q)
                await adminDb.from('products').update({ stock: ns } as never).eq('id', it.product_id)
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('[orders/deliver] stock update failed', e)
      // Don't fail the delivery if stock update fails — order is still delivered
    }

    // Mark order completed + delivered
    const { error: upErr } = await adminDb.from('orders').update({
      status: 'completed', delivery_status: 'delivered', updated_at: new Date().toISOString(),
    } as never).eq('id', id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    // In-app notification
    await adminDb.from('notifications').insert({
      id: generateId(), user_id: o.user_id, type: 'order_delivered',
      title: 'Order Delivered ✅',
      message: `Your order ${o.order_number} has been delivered. Open Orders → ${o.order_number} to see your code/account.`,
      reference_id: id, is_read: false,
    } as never)

    // Email the buyer
    let emailSent = false
    if (o.user?.email) {
      const tpl = orderConfirmationEmail({
        orderNumber: o.order_number,
        productName: firstItem?.product_name || 'Digital product',
        total: Number(o.total), currency: o.currency || 'DZD',
      })
      const r = await sendEmail({ to: o.user.email, subject: tpl.subject, html: tpl.html, text: tpl.text })
      emailSent = r.ok
    }

    return NextResponse.json({ success: true, emailSent })
  }

  if (action === 'cancel') {
    const reason = String(body.reason || 'Cancelled by admin')
    // Refund wallet if it was paid
    if (o.status === 'completed' || o.status === 'processing') {
      const { data: wallet } = await adminDb.from('wallets').select('id, balance').eq('user_id', o.user_id).single()
      if (wallet) {
        const before = Number((wallet as any).balance)
        const amount = Number(o.total)
        await adminDb.from('wallets').update({ balance: before + amount, updated_at: new Date().toISOString() } as never).eq('id', (wallet as any).id)
        await adminDb.from('wallet_transactions').insert({
          id: generateId(), user_id: o.user_id, wallet_id: (wallet as any).id,
          type: 'refund', amount, balance_before: before, balance_after: before + amount,
          reference: `ORDER-${o.order_number}`, description: `Order cancelled: ${reason}`, status: 'completed',
        } as never)
      }
    }
    await adminDb.from('orders').update({ status: 'cancelled', notes: reason, updated_at: new Date().toISOString() } as never).eq('id', id)
    await adminDb.from('notifications').insert({
      id: generateId(), user_id: o.user_id, type: 'order_cancelled',
      title: 'Order Cancelled', message: `Your order ${o.order_number} was cancelled. Reason: ${reason}. If you were charged, the amount was refunded to your wallet.`,
      reference_id: id, is_read: false,
    } as never)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}