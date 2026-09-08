import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore, slugify, generateId, type Product, type ProductVariant } from '@/lib/store'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await readStore()
  return NextResponse.json(store.products)
}

function normalizeVariants(raw: unknown, isMulti: boolean): ProductVariant[] {
  if (!isMulti || !Array.isArray(raw)) return []
  return (raw as Record<string, unknown>[])
    .filter(v => v && (v.name || v.duration_days))
    .map(v => ({
      id: generateId(),
      name: String(v.name || `${v.duration_days} days`),
      duration_days: v.duration_days ? Number(v.duration_days) : null,
      price: Number(v.price) || 0,
      compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
    }))
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const variants = normalizeVariants(body.variants, !!body.has_variants)
  if (body.has_variants && variants.length === 0) {
    return NextResponse.json({ error: 'Add at least one period with a price' }, { status: 400 })
  }
  if (!body.has_variants && (!body.price || Number(body.price) <= 0)) {
    return NextResponse.json({ error: 'Price is required' }, { status: 400 })
  }

  const store = await readStore()
  const now = new Date().toISOString()
  const product: Product = {
    id: generateId(),
    slug: `${slugify(name)}-${generateId().slice(0, 6)}`,
    name,
    description: String(body.description || ''),
    short_description: String(body.short_description || ''),
    category_id: body.category_id || null,
    image_url: body.image_url || null,
    images: Array.isArray(body.images) ? body.images.map(String) : (body.image_url ? [String(body.image_url)] : []),
    price: variants.length ? Math.min(...variants.map(v => v.price)) : Number(body.price),
    compare_at_price: body.compare_at_price ? Number(body.compare_at_price) : null,
    status: body.status === 'hidden' ? 'hidden' : 'active',
    is_featured: !!body.is_featured,
    is_popular: !!body.is_popular,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    contact_channels: Array.isArray(body.contact_channels) ? body.contact_channels.map(String) : [],
    terms: body.terms ? String(body.terms) : undefined,
    variants,
    created_at: now,
    updated_at: now,
  }

  store.products.unshift(product)
  await writeStore(store)
  return NextResponse.json({ success: true, product })
}
