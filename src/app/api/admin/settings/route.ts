import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readStore, writeStore } from '@/lib/store'
import { migrateSettings, readStoreData, writeStoreData } from '@/lib/store-data'
import type { Lang } from '@/lib/i18n'

function bilingual(body: Record<string, unknown>, key: string) {
  return {
    en: typeof body[`${key}.en`] === 'string' ? (body[`${key}.en`] as string) : '',
    fr: typeof body[`${key}.fr`] === 'string' ? (body[`${key}.fr`] as string) : '',
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const store = await readStore()
  return NextResponse.json(store.settings)
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const store = readStoreData()
  const s = store.settings
  if (body.siteName !== undefined) s.siteName = String(body.siteName).trim() || s.siteName
  if (body.tagline !== undefined) s.tagline = String(body.tagline)
  if (body.defaultLang !== undefined) {
    const dl = String(body.defaultLang)
    s.defaultLang = dl === 'fr' ? 'fr' : 'en'
  }
  if (body.currency !== undefined) s.currency = String(body.currency).trim().toUpperCase() || s.currency
  if (body.brandTagline !== undefined) s.brandTagline = String(body.brandTagline)
  if (body.brandTaglineVisible !== undefined) s.brandTaglineVisible = !!body.brandTaglineVisible
  if (body.heroBadge !== undefined) s.heroBadge = String(body.heroBadge)
  if (body.heroBadgeVisible !== undefined) s.heroBadgeVisible = !!body.heroBadgeVisible
  if (body.heroVisible !== undefined) s.heroVisible = !!body.heroVisible
  if (body.heroTitle !== undefined) s.heroTitle = bilingual(body, 'heroTitle')
  if (body.heroSubtitle !== undefined) s.heroSubtitle = bilingual(body, 'heroSubtitle')
  if (body.homeSectionNew !== undefined) s.homeSectionNew = bilingual(body, 'homeSectionNew')
  if (body.homeSectionTrending !== undefined) s.homeSectionTrending = bilingual(body, 'homeSectionTrending')
  if (body.homeSectionFeatured !== undefined) s.homeSectionFeatured = bilingual(body, 'homeSectionFeatured')
  if (body.homeSectionCategories !== undefined) s.homeSectionCategories = bilingual(body, 'homeSectionCategories')
  if (body.homeFeaturedCount !== undefined) s.homeFeaturedCount = Number(body.homeFeaturedCount) || s.homeFeaturedCount
  if (body.homeTrendingCount !== undefined) s.homeTrendingCount = Number(body.homeTrendingCount) || s.homeTrendingCount
  if (body.contactWhatsApp !== undefined) s.contactWhatsApp = String(body.contactWhatsApp)
  if (body.contactTelegram !== undefined) s.contactTelegram = String(body.contactTelegram)
  if (body.contactEmail !== undefined) s.contactEmail = String(body.contactEmail)
  if (body.contactWhatsAppVisible !== undefined) s.contactWhatsAppVisible = !!body.contactWhatsAppVisible
  if (body.contactTelegramVisible !== undefined) s.contactTelegramVisible = !!body.contactTelegramVisible
  if (body.contactEmailVisible !== undefined) s.contactEmailVisible = !!body.contactEmailVisible
  if (body.contactTitle !== undefined) s.contactTitle = bilingual(body, 'contactTitle')
  if (body.contactSubtitle !== undefined) s.contactSubtitle = bilingual(body, 'contactSubtitle')
  if (body.faqTitle !== undefined) s.faqTitle = bilingual(body, 'faqTitle')
  if (body.faqSubtitle !== undefined) s.faqSubtitle = bilingual(body, 'faqSubtitle')
  if (body.termsTitle !== undefined) s.termsTitle = bilingual(body, 'termsTitle')
  if (body.privacyTitle !== undefined) s.privacyTitle = bilingual(body, 'privacyTitle')
  if (body.dashboardTitle !== undefined) s.dashboardTitle = bilingual(body, 'dashboardTitle')
  if (body.dashboardDesc !== undefined) s.dashboardDesc = bilingual(body, 'dashboardDesc')
  if (body.noProductsTitle !== undefined) s.noProductsTitle = bilingual(body, 'noProductsTitle')
  if (body.noProductsDesc !== undefined) s.noProductsDesc = bilingual(body, 'noProductsDesc')
  if (body.notFoundTitle !== undefined) s.notFoundTitle = bilingual(body, 'notFoundTitle')
  if (body.notFoundDesc !== undefined) s.notFoundDesc = bilingual(body, 'notFoundDesc')
  if (body.searchTitle !== undefined) s.searchTitle = bilingual(body, 'searchTitle')
  if (body.searchNoResults !== undefined) s.searchNoResults = bilingual(body, 'searchNoResults')
  writeStoreData(store)
  return NextResponse.json({ success: true, settings: migrateSettings(s) })
}