import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'

export const runtime = 'edge'


async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null as any }
  const adminDb = getServerSupabase()
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes((profile as any).role)) return { res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null as any }
  return { res: null, user }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  const body = await req.json()
  const updates: any = { updated_at: new Date().toISOString() }
  if (body.status) updates.status = String(body.status)
  if (body.product_data) updates.product_data = body.product_data
  if (body.order_id !== undefined) updates.order_id = body.order_id
  if (Object.keys(updates).length === 1) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  const { data, error } = await adminDb.from('inventory_items').update(updates as never).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  // prevent deleting sold linked to order? allow but warn — we allow delete of available/reserved/disabled only
  const { data: item } = await adminDb.from('inventory_items').select('status').eq('id', id).single()
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((item as any).status === 'sold') return NextResponse.json({ error: 'Cannot delete sold item (linked to order)' }, { status: 400 })
  const { error } = await adminDb.from('inventory_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}