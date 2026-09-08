import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore, contactHref } from '@/lib/store'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const store = await readStore()
  const c = store.contacts.find(x => x.id === id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.type !== undefined) c.type = String(body.type)
  if (body.label !== undefined) c.label = String(body.label).trim() || c.label
  if (body.value !== undefined) c.value = String(body.value).trim()
  if (body.color !== undefined) c.color = String(body.color)
  if (body.sort_order !== undefined) c.sort_order = Number(body.sort_order) || 0
  // rebuild the click-to-open link whenever type/value change
  c.url = contactHref(c.type, c.value)

  await writeStore(store)
  return NextResponse.json({ success: true, contact: c })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const store = await readStore()

  // also detach from products that reference this channel
  for (const p of store.products) {
    p.contact_channels = p.contact_channels.filter(x => x !== id)
  }
  const before = store.contacts.length
  store.contacts = store.contacts.filter(c => c.id !== id)
  if (store.contacts.length === before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await writeStore(store)
  return NextResponse.json({ success: true })
}
