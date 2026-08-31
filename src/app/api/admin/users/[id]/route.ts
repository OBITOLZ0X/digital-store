import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'



async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const adminDb = getServerSupabase()
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
    return { user: null, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, res: null }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

  const adminDb = getServerSupabase()
  const body = await req.json().catch(() => ({}))

  try {
    // Fetch current user
    const { data: target, error: fetchErr } = await adminDb.from('profiles').select('id, email, full_name, role, is_verified, created_at').eq('id', id).single()
    if (fetchErr || !target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let updatedRole = target.role as string

    // 1) Role change
    if (typeof body.role === 'string' && ['customer', 'admin', 'super_admin'].includes(body.role)) {
      // Prevent demoting yourself
      if (id === auth.user!.id && body.role !== (target.role as string)) {
        return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
      }
      const { error } = await adminDb.from('profiles').update({ role: body.role }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      updatedRole = body.role

      await adminDb.from('admin_logs').insert({
        admin_id: auth.user!.id,
        action: 'user_role_changed',
        entity_type: 'profile',
        entity_id: id,
        details: { from: target.role, to: body.role, email: target.email },
        ip_address: 'server',
      })
    }

    // 2) Toggle freeze
    if (body.toggle_freeze) {
      const { data: wallet } = await adminDb.from('wallets').select('is_frozen').eq('user_id', id).single()
      if (wallet) {
        const newFrozen = !(wallet as any).is_frozen
        const { error } = await adminDb.from('wallets').update({ is_frozen: newFrozen }).eq('user_id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        await adminDb.from('admin_logs').insert({
          admin_id: auth.user!.id,
          action: newFrozen ? 'wallet_frozen' : 'wallet_unfrozen',
          entity_type: 'wallet',
          entity_id: id,
          details: { email: target.email },
          ip_address: 'server',
        })
      }
    }

    // 3) Adjust balance (creates wallet_transactions entry)
    if (typeof body.adjust_balance !== 'undefined') {
      const delta = Number(body.adjust_balance)
      if (isNaN(delta) || delta === 0) return NextResponse.json({ error: 'Invalid adjust_balance' }, { status: 400 })

      const { data: wallet } = await adminDb.from('wallets').select('id, balance').eq('user_id', id).single()
      if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

      const before = Number((wallet as any).balance)
      const after = before + delta
      if (after < 0) return NextResponse.json({ error: 'Insufficient balance: would go negative' }, { status: 400 })

      const { error: wErr } = await adminDb.from('wallets').update({ balance: after }).eq('user_id', id)
      if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 })

      const type = delta > 0 ? 'admin_credit' : 'admin_debit'
      await adminDb.from('wallet_transactions').insert({
        user_id: id,
        wallet_id: (wallet as any).id,
        type,
        amount: Math.abs(delta),
        balance_before: before,
        balance_after: after,
        reference: `admin-adjust-${Date.now()}`,
        description: `Admin ${delta > 0 ? 'credit' : 'debit'} ${Math.abs(delta)} DZD`,
        status: 'completed',
      })

      await adminDb.from('admin_logs').insert({
        admin_id: auth.user!.id,
        action: type,
        entity_type: 'wallet',
        entity_id: id,
        details: { delta, before, after, email: target.email },
        ip_address: 'server',
      })
    }

    // Return updated user
    const { data: freshProfile } = await adminDb.from('profiles').select('id, email, full_name, role, is_verified, created_at').eq('id', id).single()
    const { data: freshWallet } = await adminDb.from('wallets').select('balance, is_frozen').eq('user_id', id).single()

    return NextResponse.json({
      success: true,
      user: {
        id: (freshProfile as any).id,
        email: (freshProfile as any).email,
        full_name: (freshProfile as any).full_name,
        role: (freshProfile as any).role,
        is_verified: (freshProfile as any).is_verified,
        created_at: (freshProfile as any).created_at,
        wallet: freshWallet || { balance: 0, is_frozen: false },
      }
    })
  } catch (e) {
    console.error('PATCH /api/admin/users/[id] error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  if (id === auth.user!.id) return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 })

  const adminDb = getServerSupabase()

  // Fetch to log
  const { data: target } = await adminDb.from('profiles').select('email').eq('id', id).single()

  // Delete auth user (cascades to profiles/wallets via FK)
  const { error } = await adminDb.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fallback: ensure profile/wallet cleaned if cascade not set
  await adminDb.from('profiles').delete().eq('id', id)

  await adminDb.from('admin_logs').insert({
    admin_id: auth.user!.id,
    action: 'user_deleted',
    entity_type: 'profile',
    entity_id: id,
    details: { email: (target as any)?.email || id },
    ip_address: 'server',
  })

  return NextResponse.json({ success: true })
}