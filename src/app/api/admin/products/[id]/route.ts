import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore, generateId, type ProductVariant } from '@/lib/store'
import { normalizeYouTubeUrl } from '@/lib/youtube'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const store = await readStore()
  const p = store.products.find(x => x.id === id)
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const store = await readStore()
  const p = store.products.find(x => x.id === id)
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.name !== undefined) p.name = String(body.name).trim() || p.name
  if (body.description !== undefined) p.description = String(body.description)
  if (body.short_description !== undefined) p.short_description = String(body.short_description)
  if (body.category_id !== undefined) p.category_id = body.category_id || null
  if (body.image_url !== undefined) p.image_url = body.image_url || null
  if (body.images !== undefined) {
    p.images = Array.isArray(body.images) ? body.images.map(String) : []
    if (p.images.length && !p.image_url) p.image_url = p.images[0]
  }
  if (body.status !== undefined) p.status = body.status === 'hidden' ? 'hidden' : 'active'
  if (body.is_featured !== undefined) p.is_featured = !!body.is_featured
  if (body.is_popular !== undefined) p.is_popular = !!body.is_popular
  if (body.tags !== undefined) p.tags = Array.isArray(body.tags) ? body.tags.map(String) : []
  if (body.contact_channels !== undefined) p.contact_channels = Array.isArray(body.contact_channels) ? body.contact_channels.map(String) : []
  if (body.terms !== undefined) p.terms = body.terms ? String(body.terms) : undefined
  if (body.tutorial_url !== undefined) {
    const t = String(body.tutorial_url || '').trim()
    if (t) {
      const norm = normalizeYouTubeUrl(t)
      if (!norm) return NextResponse.json({ error: 'Tutorial link must be a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)' }, { status: 400 })
      p.tutorial_url = norm
    } else {
      p.tutorial_url = null
    }
  }
  if (body.compare_at_price !== undefined) p.compare_at_price = body.compare_at_price ? Number(body.compare_at_price) : null

  // Variants are replaced wholesale (durations edited as a list in the form)
  if (body.has_variants !== undefined || Array.isArray(body.variants)) {
    const isMulti = !!body.has_variants
    if (isMulti) {
      const incoming = (Array.isArray(body.variants) ? body.variants : []) as Record<string, unknown>[]
      const cleaned = incoming.filter(v => v && (v.name || v.duration_days))
      if (cleaned.length === 0) return NextResponse.json({ error: 'Add at least one period with a price' }, { status: 400 })
      // keep ids where provided so analytics/links stay stable
      p.variants = cleaned.map((v, i) => ({
        id: (typeof v.id === 'string' && v.id) || generateId(),
        name: String(v.name || `${v.duration_days} days`),
        duration_days: v.duration_days ? Number(v.duration_days) : null,
        price: Number(v.price) || 0,
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
      })) as ProductVariant[]
      p.price = Math.min(...p.variants.map(v => v.price))
    } else {
      p.variants = []
      if (body.price !== undefined) {
        if (!body.price || Number(body.price) <= 0) return NextResponse.json({ error: 'Price is required' }, { status: 400 })
        p.price = Number(body.price)
      }
    }
  } else if (body.price !== undefined && p.variants.length === 0) {
    if (!body.price || Number(body.price) <= 0) return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    p.price = Number(body.price)
  }

  p.updated_at = new Date().toISOString()
  await writeStore(store)
  return NextResponse.json({ success: true, product: p })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const store = await readStore()
  const before = store.products.length
  store.products = store.products.filter(x => x.id !== id)
  if (store.products.length === before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await writeStore(store)
  return NextResponse.json({ success: true })
}
