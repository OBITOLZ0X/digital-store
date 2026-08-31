import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'



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

  const { data: deposit, error: depErr } = await adminDb.from('deposit_requests').select('*').eq('id', id).single()
  if (depErr || !deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
  if ((deposit as any).status !== 'pending') return NextResponse.json({ error: 'Deposit already processed' }, { status: 400 })

  if (action === 'approve') {
    // Credit the user's wallet
    const { data: wallet, error: wErr } = await adminDb.from('wallets').select('id, balance, currency').eq('user_id', (deposit as any).user_id).single()
    if (wErr || !wallet) return NextResponse.json({ error: 'User wallet not found' }, { status: 500 })
    const before = Number((wallet as any).balance)
    const amount = Number((deposit as any).amount)
    const after = before + amount
    const { error: upErr } = await adminDb.from('wallets').update({ balance: after, updated_at: new Date().toISOString() } as never).eq('id', (wallet as any).id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    await adminDb.from('wallet_transactions').insert({
      id: generateId(), user_id: (deposit as any).user_id, wallet_id: (wallet as any).id,
      type: 'deposit', amount, balance_before: before, balance_after: after,
      reference: `DEPOSIT-${id.slice(0, 8).toUpperCase()}`,
      description: `Deposit approved (${(deposit as any).payment_method})`, status: 'completed',
    } as never)

    await adminDb.from('deposit_requests').update({ status: 'approved', admin_id: user.id, updated_at: new Date().toISOString() } as never).eq('id', id)
    await adminDb.from('notifications').insert({
      id: generateId(), user_id: (deposit as any).user_id, type: 'deposit_approved',
      title: 'Deposit Approved', message: `Your deposit of ${amount.toFixed(2)} DZD has been approved and credited to your wallet.`,
      reference_id: id, is_read: false,
    } as never)
    return NextResponse.json({ success: true, new_balance: after })
  }

  if (action === 'reject') {
    const reason = String(body.reason || 'Proof could not be verified')
    await adminDb.from('deposit_requests').update({ status: 'rejected', admin_id: user.id, rejection_reason: reason, updated_at: new Date().toISOString() } as never).eq('id', id)
    await adminDb.from('notifications').insert({
      id: generateId(), user_id: (deposit as any).user_id, type: 'deposit_rejected',
      title: 'Deposit Rejected', message: `Your deposit of ${Number((deposit as any).amount).toFixed(2)} DZD was rejected. Reason: ${reason}`,
      reference_id: id, is_read: false,
    } as never)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}