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

export async function GET() {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  const { data, error } = await adminDb
    .from('products')
    .select('*, category:categories(name), variants:product_variants(id, name, price, stock, duration_days)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Fetch inventory counts per product/variant for automatic products (live stock)
  const pids = (data||[]).map((p:any)=>p.id)
  let invStats: Record<string, { variantStats: Record<string,{available:number,total:number}>, productAvailable:number, productTotal:number }> = {}
  if (pids.length) {
    const { data: inv } = await adminDb.from('inventory_items').select('product_id, variant_id, status').in('product_id', pids).limit(5000)
    for (const row of (inv as any[]) || []) {
      if (!invStats[row.product_id]) invStats[row.product_id] = { variantStats:{}, productAvailable:0, productTotal:0 }
      const s = invStats[row.product_id]
      s.productTotal++
      if (row.status === 'available') s.productAvailable++
      if (row.variant_id) {
        if (!s.variantStats[row.variant_id]) s.variantStats[row.variant_id] = { available:0, total:0 }
        s.variantStats[row.variant_id].total++
        if (row.status === 'available') s.variantStats[row.variant_id].available++
      }
    }
  }
  // normalize images[] -> image_url for catalog + attach invStats
  const mapped = (data||[]).map((p:any)=> ({
    ...p,
    image_url: Array.isArray(p.images) && p.images[0] ? p.images[0] : (p as any).image_url || null,
    inventory: invStats[p.id] || { variantStats:{}, productAvailable:0, productTotal:0 }
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()

  try {
    const body = await req.json()
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const variantsRaw: any[] = Array.isArray(body.variants) ? body.variants : []
    const hasVariants = variantsRaw.filter(v => v && (v.name || v.price)).length > 0
    const isAutomatic = body.delivery_type === 'automatic'
    const price = hasVariants ? 0 : Number(body.price)
    if (!hasVariants && isNaN(price)) return NextResponse.json({ error: 'Name and valid price required' }, { status: 400 })

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`
    const images: string[] = body.image_url ? [String(body.image_url)] : []

    const { data: product, error: prodError } = await adminDb
      .from('products')
      .insert({
        name,
        slug,
        description: body.description || null,
        short_description: body.short_description || null,
        category_id: body.category_id || null,
        images,
        price,
        compare_at_price: hasVariants ? null : (body.compare_at_price ? Number(body.compare_at_price) : null),
        currency: 'DZD',
        stock: isAutomatic ? 0 : (hasVariants ? 0 : Number(body.stock || 0)),
        sku: body.sku || null,
        status: body.status || 'active',
        is_featured: !!body.is_featured,
        is_popular: !!body.is_popular,
        product_type: body.product_type || 'digital_key',
        delivery_type: body.delivery_type || 'automatic',
        subscription_duration_days: body.subscription_duration_days ? Number(body.subscription_duration_days) : null,
        instructions: body.instructions || null,
      })
      .select()
      .single()

    if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 })

    // Insert duration variants -> product_variants (name + duration_days + price + stock)
    const variants: any[] = Array.isArray(body.variants) ? body.variants : []
    let variantIds: string[] = []
    if (variants.length > 0) {
      const rows = variants
        .filter(v => v && (v.name || v.price))
        .map((v, i) => ({
          product_id: product.id,
          name: String(v.name || `Option ${i + 1}`),
          duration_days: v.duration_days ? Number(v.duration_days) : null,
          price: Number(v.price) || 0,
          compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
          stock: isAutomatic ? 0 : Number(v.stock || 0),
          sku: v.sku || null,
          sort_order: i,
        }))
      if (rows.length > 0) {
        const { data: inserted, error: vError } = await adminDb
          .from('product_variants')
          .insert(rows)
          .select('id')
        if (vError) {
          console.error('variant insert error:', vError)
          // Roll back product if variants failed — otherwise you get a 0-price product with no variants
          await adminDb.from('products').delete().eq('id', product.id)
          return NextResponse.json({ error: 'Failed to create variants: ' + vError.message }, { status: 500 })
        }
        variantIds = (inserted || []).map((r: any) => r.id)
      }
    }

    // Insert inventory keys -> inventory_items.product_data (jsonb)
    const inventory: any[] = Array.isArray(body.inventory) ? body.inventory : []
    const invRows = inventory
      .filter(i => i && (i.email || i.password || i.code))
      .map(item => {
        const product_data: Record<string, string> = {}
        if (item.email) product_data.email = String(item.email)
        if (item.password) product_data.password = String(item.password)
        if (item.code) product_data.code = String(item.code)
        if (item.notes) product_data.notes = String(item.notes)
        const vIdx = item.variant_index
        const variant_id = (typeof vIdx === 'number' && variantIds[vIdx]) ? variantIds[vIdx] : null
        return { product_id: product.id, variant_id, product_data, status: 'available' }
      })
    if (invRows.length > 0) {
      const { error: invError } = await adminDb.from('inventory_items').insert(invRows)
      if (invError) console.error('inventory insert error:', invError)
    }

    return NextResponse.json({ success: true, data: product })
  } catch (e) {
    console.error('POST /api/admin/products error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 })
  }
}