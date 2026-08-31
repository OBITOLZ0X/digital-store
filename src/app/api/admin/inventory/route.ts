import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'
import { generateId } from '@/lib/utils'

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

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  const status = req.nextUrl.searchParams.get('status')
  const product_id = req.nextUrl.searchParams.get('product_id')
  let q = adminDb
    .from('inventory_items')
    .select('*, product:products!inventory_items_product_id_fkey(id,name,slug,status), variant:product_variants(id,name)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status) q = q.eq('status', status)
  if (product_id) q = q.eq('product_id', product_id)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  const body = await req.json()

  // Bulk create: expects { product_id, variant_id?, items: [{product_data}, ...] } OR single { product_id, variant_id?, product_data }
  const product_id = String(body.product_id || '').trim()
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  // verify product exists
  const { data: prod } = await adminDb.from('products').select('id').eq('id', product_id).single()
  if (!prod) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  let rows: any[] = []
  if (Array.isArray(body.items) && body.items.length > 0) {
    rows = body.items.map((it: any) => ({
      id: generateId(),
      product_id,
      variant_id: body.variant_id || it.variant_id || null,
      product_data: it.product_data || it || {},
      status: it.status || 'available',
    }))
  } else if (body.bulk_text) {
    // bulk_text: lines like "email:pass" or "CODE-123" or "user | pass | notes"
    const lines = String(body.bulk_text).split('\n').map(s => s.trim()).filter(Boolean)
    rows = lines.map(line => {
      let pd: Record<string,string> = {}
      if (line.includes(':') && !line.includes('|')) {
        const [email, ...rest] = line.split(':')
        pd.email = email.trim()
        pd.password = rest.join(':').trim()
        if (!pd.password) pd.code = pd.email
      } else if (line.includes('|')) {
        const parts = line.split('|').map(s=>s.trim())
        if (parts[0]) pd.email = parts[0]
        if (parts[1]) pd.password = parts[1]
        if (parts[2]) pd.notes = parts[2]
      } else {
        pd.code = line
      }
      return { id: generateId(), product_id, variant_id: body.variant_id || null, product_data: pd, status: 'available' }
    })
  } else if (body.product_data) {
    rows = [{ id: generateId(), product_id, variant_id: body.variant_id || null, product_data: body.product_data, status: body.status || 'available' }]
  } else {
    return NextResponse.json({ error: 'Provide product_data or items or bulk_text' }, { status: 400 })
  }

  // validate product_data not empty
  rows = rows.filter(r => r.product_data && Object.keys(r.product_data).length > 0)
  if (rows.length === 0) return NextResponse.json({ error: 'No valid inventory data' }, { status: 400 })

  const { data, error } = await adminDb.from('inventory_items').insert(rows as never).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
