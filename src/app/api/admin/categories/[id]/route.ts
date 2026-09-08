import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore, slugify } from '@/lib/store'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const store = await readStore()
  const cat = store.categories.find(c => c.id === id)
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.name !== undefined) {
    cat.name = String(body.name).trim() || cat.name
    cat.slug = slugify(cat.name)
  }
  if (body.description !== undefined) cat.description = body.description ? String(body.description) : null
  if (body.image_url !== undefined) cat.image_url = body.image_url || null
  if (body.sort_order !== undefined) cat.sort_order = Number(body.sort_order) || 0

  await writeStore(store)
  return NextResponse.json({ success: true, category: cat })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const store = await readStore()

  // detach products from the deleted category instead of blocking the delete
  for (const p of store.products) {
    if (p.category_id === id) p.category_id = null
  }
  const before = store.categories.length
  store.categories = store.categories.filter(c => c.id !== id)
  if (store.categories.length === before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await writeStore(store)
  return NextResponse.json({ success: true })
}
