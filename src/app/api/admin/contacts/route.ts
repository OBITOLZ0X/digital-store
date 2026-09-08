import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore, contactHref, generateId, type ContactChannel } from '@/lib/store'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await readStore()
  return NextResponse.json([...store.contacts].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const type = String(body.type || 'custom')
  const value = String(body.value || '').trim()
  if (!value) return NextResponse.json({ error: 'Value (number / username / link) is required' }, { status: 400 })

  const store = await readStore()
  const channel: ContactChannel = {
    id: generateId(),
    type,
    label: String(body.label || '').trim() || type.charAt(0).toUpperCase() + type.slice(1),
    value,
    url: contactHref(type, value),
    color: String(body.color || '#7c3aed'),
    sort_order: Number(body.sort_order) || store.contacts.length,
  }
  store.contacts.push(channel)
  await writeStore(store)
  return NextResponse.json({ success: true, contact: channel })
}
