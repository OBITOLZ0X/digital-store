import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'

export const runtime = 'edge'


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

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()

  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const full_name = String(body.full_name || '').trim()
    const role = String(body.role || 'customer')
    const initial_balance = body.initial_balance !== undefined ? Number(body.initial_balance) : 0

    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    if (!['customer', 'admin', 'super_admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

    // Create auth user via service_role (bypasses email confirmation)
    const { data, error } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const uid = data.user.id

    // Update role if not customer (trigger creates customer by default)
    if (role !== 'customer') {
      const { error: roleErr } = await adminDb.from('profiles').update({ role }).eq('id', uid)
      if (roleErr) console.error('role update failed:', roleErr)
    }
    if (full_name) {
      await adminDb.from('profiles').update({ full_name }).eq('id', uid)
    }

    // Set initial balance if provided
    if (initial_balance !== 0 && !isNaN(initial_balance)) {
      const { data: wallet } = await adminDb.from('wallets').select('id, balance').eq('user_id', uid).single()
      if (wallet) {
        const before = Number((wallet as any).balance)
        const after = before + initial_balance
        await adminDb.from('wallets').update({ balance: after }).eq('user_id', uid)
        await adminDb.from('wallet_transactions').insert({
          user_id: uid,
          wallet_id: (wallet as any).id,
          type: initial_balance > 0 ? 'admin_credit' : 'admin_debit',
          amount: Math.abs(initial_balance),
          balance_before: before,
          balance_after: after,
          reference: `admin-create-${Date.now()}`,
          description: `Initial balance ${initial_balance} DZD`,
          status: 'completed',
        })
      }
    }

    await adminDb.from('admin_logs').insert({
      admin_id: auth.user!.id,
      action: 'user_created',
      entity_type: 'profile',
      entity_id: uid,
      details: { email, role, initial_balance },
      ip_address: 'server',
    })

    // Return fresh profile + wallet
    const { data: profile } = await adminDb.from('profiles').select('id, email, full_name, role, is_verified, created_at').eq('id', uid).single()
    const { data: wallet } = await adminDb.from('wallets').select('balance, is_frozen').eq('user_id', uid).single()

    return NextResponse.json({
      success: true,
      user: {
        id: (profile as any).id,
        email: (profile as any).email,
        full_name: (profile as any).full_name,
        role: (profile as any).role,
        is_verified: (profile as any).is_verified,
        created_at: (profile as any).created_at,
        wallet: wallet || { balance: 0, is_frozen: false },
      }
    })
  } catch (e) {
    console.error('POST /api/admin/users error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  const { data: profiles, error } = await adminDb.from('profiles').select('id, email, full_name, role, is_verified, created_at').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (profiles || []).map(p => (p as any).id)
  let walletsByUser: Record<string, any> = {}
  if (ids.length > 0) {
    const { data: wallets } = await adminDb.from('wallets').select('user_id, balance, is_frozen').in('user_id', ids)
    for (const w of wallets || []) walletsByUser[(w as any).user_id] = w
  }
  const users = (profiles || []).map(p => ({
    id: (p as any).id,
    email: (p as any).email,
    full_name: (p as any).full_name,
    role: (p as any).role,
    is_verified: (p as any).is_verified,
    created_at: (p as any).created_at,
    wallet: walletsByUser[(p as any).id] || { balance: 0, is_frozen: false }
  }))
  return NextResponse.json(users)
}