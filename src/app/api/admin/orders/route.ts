import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'

export const runtime = 'edge'


export async function GET(req: NextRequest) {
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

  const status = req.nextUrl.searchParams.get('status')
  let query = adminDb
    .from('orders')
    .select('*, user:profiles!orders_user_id_fkey(id, email, full_name), items:order_items(id, product_id, product_name, variant_name, quantity, unit_price, total_price)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const orders = (data || []) as any[]
  // Fetch inventory separately — inventory_items.order_id has no FK, so can't use embedded join
  const orderIds = orders.map((o:any)=>o.id)
  let invByOrder: Record<string, any[]> = {}
  if (orderIds.length) {
    const { data: inv } = await adminDb.from('inventory_items').select('id, order_id, product_data, status, variant_id, sold_at').in('order_id', orderIds)
    for (const row of (inv as any[]) || []) {
      if (!invByOrder[row.order_id]) invByOrder[row.order_id] = []
      invByOrder[row.order_id].push(row)
    }
  }
  // Enrich with product delivery_type for UI (need product_id from items)
  // collect productIds to fetch delivery_type once
  const pids = [...new Set(orders.flatMap(o => (o.items || []).map((it:any)=>it.product_id)).filter(Boolean))]
  let deliveryMap: Record<string,string> = {}
  let productStockMap: Record<string, number> = {}
  if (pids.length){
    const { data: prods } = await adminDb.from('products').select('id, delivery_type, stock').in('id', pids)
    for (const p of (prods as any[]) || []) { deliveryMap[p.id] = p.delivery_type; productStockMap[p.id] = Number(p.stock ?? 0) }
  }
  // Fetch variant stocks for all variant_ids in orders
  const variantIds = [...new Set(orders.flatMap(o => (o.items || []).map((it:any)=>it.variant_id)).filter(Boolean))] as string[]
  let variantStockMap: Record<string, number> = {}
  if (variantIds.length) {
    const { data: vars } = await adminDb.from('product_variants').select('id, stock').in('id', variantIds)
    for (const v of (vars as any[]) || []) variantStockMap[v.id] = Number(v.stock ?? 0)
  }
  const enriched = orders.map(o => ({
    ...o,
    inventory: invByOrder[o.id] || [],
    delivery_type: o.items?.[0]?.product_id ? (deliveryMap[o.items[0].product_id] || null) : null,
    product_stock: o.items?.[0]?.product_id ? (productStockMap[o.items[0].product_id] ?? null) : null,
    variant_stock: o.items?.[0]?.variant_id ? (variantStockMap[o.items[0].variant_id] ?? null) : null,
  }))
  return NextResponse.json(enriched)
}