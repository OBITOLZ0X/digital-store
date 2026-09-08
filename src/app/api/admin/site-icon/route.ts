// Store the site icon (favicon) URL in KV/JSON settings via a dedicated key so
// the root layout can read it without the full store. Simplest: reuse settings.
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore } from '@/lib/store'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await readStore()
  return NextResponse.json({ icon: store.settings.siteIcon || null })
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const store = await readStore()
  store.settings.siteIcon = body.url || null
  await writeStore(store)
  return NextResponse.json({ success: true, icon: store.settings.siteIcon })
}
