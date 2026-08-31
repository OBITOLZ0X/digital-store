import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'



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
    .from('subscriptions')
    .select('*, user:profiles!subscriptions_user_id_fkey(id, email, full_name), product:products(id, name, slug), variant:product_variants(id, name), order:orders!subscriptions_order_id_fkey(id, order_number)')
    .order('expiration_date', { ascending: true })
    .limit(100)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch inventory product_data for credentials_ref separately (optional)
  const subs = (data || []) as any[]
  const credIds = subs.map(s=>s.credentials_ref).filter(Boolean)
  let invMap: Record<string, any> = {}
  if (credIds.length) {
    const { data: invs } = await adminDb.from('inventory_items').select('id, product_data').in('id', credIds)
    for (const r of (invs as any[]) || []) invMap[r.id] = r
  }
  const enriched = subs.map(s=> ({ ...s, inventory: s.credentials_ref ? (invMap[s.credentials_ref]||null) : null }))
  return NextResponse.json(enriched)
}