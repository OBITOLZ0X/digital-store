import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore, slugify, generateId, type Category } from '@/lib/store'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await readStore()
  return NextResponse.json([...store.categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const store = await readStore()
  const slug = slugify(name)
  if (store.categories.some(c => c.slug === slug)) {
    return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 })
  }

  const cat: Category = {
    id: generateId(),
    name,
    slug,
    description: body.description ? String(body.description) : null,
    image_url: body.image_url || null,
    sort_order: Number(body.sort_order) || 999,
  }
  store.categories.push(cat)
  await writeStore(store)
  return NextResponse.json({ success: true, category: cat })
}
