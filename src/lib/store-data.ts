import fs from 'fs'
import path from 'path'
import { DEFAULT_SETTINGS, DEFAULT_SECTIONS, DEFAULT_DATA } from '@/lib/store'
import type { Lang, Bilingual } from '@/lib/i18n'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'store.data.json')

function ensureBilingual(v: unknown, fallback: Bilingual): Bilingual {
  return v && typeof v === 'object' && 'en' in v && 'fr' in v ? v as Bilingual : { ...fallback }
}

export function migrateSettings(s: any): typeof DEFAULT_SETTINGS {
  const merged = { ...DEFAULT_SETTINGS, ...(s || {}) }
  if (!Array.isArray(merged.sections) || merged.sections.length === 0) merged.sections = DEFAULT_SECTIONS
  if (!Array.isArray(merged.heroImages)) merged.heroImages = []
  const byKey = new Map(merged.sections.map((x: any) => [x.key, x]))
  merged.sections = DEFAULT_SECTIONS.map((def: any) => {
    const inc = byKey.get(def.key) || {}
    return { ...def, ...inc, show_desktop: inc.show_desktop ?? def.show_desktop, show_mobile: inc.show_mobile ?? def.show_mobile }
  }).sort((a: any, b: any) => a.sort - b.sort)
  if (typeof merged.heroTrending !== 'boolean') merged.heroTrending = true
  if (typeof merged.heroTrendingDesktop !== 'boolean') merged.heroTrendingDesktop = true
  if (typeof merged.heroTrendingMobile !== 'boolean') merged.heroTrendingMobile = true
  if (!merged.defaultLang) merged.defaultLang = 'en'
  merged.heroTitle = ensureBilingual(merged.heroTitle, DEFAULT_SETTINGS.heroTitle)
  merged.heroSubtitle = ensureBilingual(merged.heroSubtitle, DEFAULT_SETTINGS.heroSubtitle)
  merged.homeSectionNew = ensureBilingual(merged.homeSectionNew, DEFAULT_SETTINGS.homeSectionNew)
  merged.homeSectionTrending = ensureBilingual(merged.homeSectionTrending, DEFAULT_SETTINGS.homeSectionTrending)
  merged.homeSectionFeatured = ensureBilingual(merged.homeSectionFeatured, DEFAULT_SETTINGS.homeSectionFeatured)
  merged.homeSectionCategories = ensureBilingual(merged.homeSectionCategories, DEFAULT_SETTINGS.homeSectionCategories)
  merged.contactTitle = ensureBilingual(merged.contactTitle, DEFAULT_SETTINGS.contactTitle)
  merged.contactSubtitle = ensureBilingual(merged.contactSubtitle, DEFAULT_SETTINGS.contactSubtitle)
  merged.faqTitle = ensureBilingual(merged.faqTitle, DEFAULT_SETTINGS.faqTitle)
  merged.faqSubtitle = ensureBilingual(merged.faqSubtitle, DEFAULT_SETTINGS.faqSubtitle)
  merged.termsTitle = ensureBilingual(merged.termsTitle, DEFAULT_SETTINGS.termsTitle)
  merged.privacyTitle = ensureBilingual(merged.privacyTitle, DEFAULT_SETTINGS.privacyTitle)
  merged.dashboardTitle = ensureBilingual(merged.dashboardTitle, DEFAULT_SETTINGS.dashboardTitle)
  merged.dashboardDesc = ensureBilingual(merged.dashboardDesc, DEFAULT_SETTINGS.dashboardDesc)
  merged.noProductsTitle = ensureBilingual(merged.noProductsTitle, DEFAULT_SETTINGS.noProductsTitle)
  merged.noProductsDesc = ensureBilingual(merged.noProductsDesc, DEFAULT_SETTINGS.noProductsDesc)
  merged.notFoundTitle = ensureBilingual(merged.notFoundTitle, DEFAULT_SETTINGS.notFoundTitle)
  merged.notFoundDesc = ensureBilingual(merged.notFoundDesc, DEFAULT_SETTINGS.notFoundDesc)
  merged.searchTitle = ensureBilingual(merged.searchTitle, DEFAULT_SETTINGS.searchTitle)
  merged.searchNoResults = ensureBilingual(merged.searchNoResults, DEFAULT_SETTINGS.searchNoResults)
  return merged
}

export function readStoreData(): { settings: typeof DEFAULT_SETTINGS; categories: any[]; products: any[]; contacts: any[] } {
  try {
    if (!fs.existsSync(DATA_FILE)) return { settings: DEFAULT_SETTINGS, categories: [], products: [], contacts: [] }
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return { settings: migrateSettings(parsed.settings), categories: parsed.categories || [], products: parsed.products || [], contacts: parsed.contacts || [] }
  } catch {
    return { settings: DEFAULT_SETTINGS, categories: [], products: [], contacts: [] }
  }
}

export function writeStoreData(data: { settings: typeof DEFAULT_SETTINGS; categories: any[]; products: any[]; contacts: any[] }) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}