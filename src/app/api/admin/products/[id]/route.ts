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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  const { data: product, error } = await adminDb.from('products').select('*, category:categories(name)').eq('id', id).single()
  if (error || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  const { data: variants } = await adminDb.from('product_variants').select('*').eq('product_id', id).order('sort_order')
  const { data: inventory } = await adminDb.from('inventory_items').select('id, variant_id, product_data, status').eq('product_id', id).limit(2000)
  return NextResponse.json({ product, variants: variants || [], inventory: inventory || [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()
  const body = await req.json()

  // Update product fields
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  const fields = ['name','description','short_description','category_id','price','compare_at_price','stock','sku','status','is_featured','is_popular','product_type','delivery_type','subscription_duration_days','instructions']
  for (const f of fields) if (body[f] !== undefined) updates[f] = body[f] === '' ? null : body[f]
  if (body.image_url !== undefined) updates.images = body.image_url ? [String(body.image_url)] : []
  if (body.price !== undefined) updates.price = Number(body.price)
  if (body.compare_at_price !== undefined) updates.compare_at_price = body.compare_at_price ? Number(body.compare_at_price) : null
  if (body.stock !== undefined) updates.stock = Number(body.stock)
  if (body.subscription_duration_days !== undefined) updates.subscription_duration_days = body.subscription_duration_days ? Number(body.subscription_duration_days) : null
  // Variant products must have base price/stock = 0 (real values live on variants). Enforce server-side.
  // Automatic delivery: stock is always 0 (counted from inventory_items)
  const hasVariantsInBody = Array.isArray(body.variants) && body.variants.filter((v:any)=> v && (v.name || v.price)).length > 0
  const isAutomaticUpdate = body.delivery_type === 'automatic' || (body.delivery_type === undefined && false) // will check existing product below if needed
  // Check existing product delivery_type if not in body
  let existingIsAutomatic = false
  if (!isAutomaticUpdate && body.delivery_type === undefined) {
    const { data: existingProd } = await adminDb.from('products').select('delivery_type').eq('id', id).single()
    existingIsAutomatic = existingProd?.delivery_type === 'automatic'
  }
  const forceZeroStock = isAutomaticUpdate || existingIsAutomatic
  if (hasVariantsInBody) {
    updates.price = 0
    updates.stock = 0
    updates.compare_at_price = null
  } else if (forceZeroStock) {
    // automatic single product — stock must be 0
    if (updates.stock !== undefined || body.stock !== undefined) updates.stock = 0
  }
  // slug update if name changed? keep existing unless explicitly provided
  if (body.slug) updates.slug = String(body.slug)

  if (Object.keys(updates).length > 1) {
    const { error } = await adminDb.from('products').update(updates as never).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Variants replacement if provided
  if (Array.isArray(body.variants)) {
    // delete old, insert new (inventory variant_id will SET NULL automatically)
    await adminDb.from('product_variants').delete().eq('product_id', id)
    const rows = body.variants.filter((v:any)=> v && (v.name || v.price)).map((v:any,i:number)=>({
      product_id: id,
      name: String(v.name || `Option ${i+1}`),
      duration_days: v.duration_days ? Number(v.duration_days) : null,
      price: Number(v.price) || 0,
      compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
      stock: forceZeroStock ? 0 : Number(v.stock || 0),
      sku: v.sku || null,
      sort_order: i,
    }))
    if (rows.length > 0) {
      const { error: vErr } = await adminDb.from('product_variants').insert(rows as never)
      if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.res) return auth.res
  const adminDb = getServerSupabase()

  // Fetch product
  const { data: product } = await adminDb.from('products').select('id,name,status').eq('id', id).single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Check dependencies: orders and inventory
  const [{ data: orderItems }, { data: invCheck }] = await Promise.all([
    adminDb.from('order_items').select('id').eq('product_id', id).limit(1),
    adminDb.from('inventory_items').select('id,status').eq('product_id', id).limit(1),
  ])
  const hasOrders = Array.isArray(orderItems) && orderItems.length > 0
  const hasInventory = Array.isArray(invCheck) && invCheck.length > 0

  if (hasOrders || hasInventory) {
    // Soft delete: archive product so FK order_items stays valid and inventory can show "deleted product"
    const { error: updErr } = await adminDb.from('products').update({ status: 'archived', updated_at: new Date().toISOString() } as never).eq('id', id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    // Mark available inventory as disabled — keeps history but prevents auto-delivery for deleted product
    if (hasInventory) {
      await adminDb.from('inventory_items').update({ status: 'disabled', updated_at: new Date().toISOString() } as never).eq('product_id', id).eq('status', 'available')
    }
    // Admin log
    try { await adminDb.from('admin_logs').insert({ id: generateId(), admin_id: auth.user.id, action: 'product_archived', entity_type: 'product', entity_id: id, details: { name: (product as any).name, hasOrders, hasInventory } } as never) } catch {}
    return NextResponse.json({ success: true, soft: true, message: hasOrders ? 'Product archived — has orders, kept for history. Inventory marked as deleted product.' : 'Product archived — inventory kept and marked as deleted product.' })
  }

  // No dependencies — safe to hard delete (variants cascade, no orders/inventory to keep)
  const { error } = await adminDb.from('products').delete().eq('id', id)
  if (error) {
    // Fallback: if FK race, archive instead
    if (error.message.includes('foreign key') || error.message.includes('violates')) {
      await adminDb.from('products').update({ status: 'archived', updated_at: new Date().toISOString() } as never).eq('id', id)
      return NextResponse.json({ success: true, soft: true, message: 'Product archived (FK fallback).' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}