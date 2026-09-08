import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore } from '@/lib/store'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await readStore()
  return NextResponse.json(store.settings)
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const store = await readStore()
  if (body.siteName !== undefined) store.settings.siteName = String(body.siteName).trim() || store.settings.siteName
  if (body.tagline !== undefined) store.settings.tagline = String(body.tagline)
  if (body.currency !== undefined) store.settings.currency = String(body.currency).trim().toUpperCase() || store.settings.currency
  await writeStore(store)
  return NextResponse.json({ success: true, settings: store.settings })
}
