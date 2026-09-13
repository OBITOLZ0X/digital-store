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
  if (body.heroBadge !== undefined) store.settings.heroBadge = String(body.heroBadge)
  if (body.heroTitle !== undefined) store.settings.heroTitle = String(body.heroTitle)
  if (body.heroSubtitle !== undefined) store.settings.heroSubtitle = String(body.heroSubtitle)
  if (body.heroCtaText !== undefined) store.settings.heroCtaText = String(body.heroCtaText)
  if (body.heroImages !== undefined) store.settings.heroImages = Array.isArray(body.heroImages) ? body.heroImages.map(String) : []
  if (body.heroTrending !== undefined) store.settings.heroTrending = !!body.heroTrending
  if (body.heroTrendingDesktop !== undefined) store.settings.heroTrendingDesktop = !!body.heroTrendingDesktop
  if (body.heroTrendingMobile !== undefined) store.settings.heroTrendingMobile = !!body.heroTrendingMobile
  if (body.sections !== undefined && Array.isArray(body.sections)) {
    const incoming = body.sections as { key: string; title?: string; visible?: boolean; show_desktop?: boolean; show_mobile?: boolean; sort?: number }[]
    store.settings.sections = store.settings.sections.map(def => {
      const inc = incoming.find(x => x.key === def.key)
      return inc ? { ...def, title: inc.title ?? def.title, visible: inc.visible ?? def.visible, show_desktop: inc.show_desktop ?? def.show_desktop, show_mobile: inc.show_mobile ?? def.show_mobile, sort: inc.sort ?? def.sort } : def
    })
  }
  await writeStore(store)
  return NextResponse.json({ success: true, settings: store.settings })
}
