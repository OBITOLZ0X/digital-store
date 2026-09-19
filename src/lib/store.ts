// JSON-backed data layer — no user accounts, no database.
// Only two things are stored: the catalog (products/categories/contacts/settings)
// and visit analytics. Admin credentials live in env vars (secret), never here.
//
// Storage backends, in order:
//   1. Cloudflare KV   — via @opennextjs/cloudflare getCloudflareContext() (workers/edge)
//   2. Filesystem      — data/store.data.json (node host / `next start`)

import fs from 'fs'
import path from 'path'

// ---------- Types ----------

export interface ProductVariant {
  id: string
  name: string // e.g. "1 Month", "3 Months"
  duration_days: number | null
  price: number
  compare_at_price?: number | null
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  short_description: string
  category_id: string | null // primary category (= category_ids[0])
  category_ids: string[] // every category this product belongs to
  image_url: string | null
  images: string[] // gallery for the product page slider (first = cover)
  price: number // effective display price (min of variants when multi)
  compare_at_price: number | null
  status: 'active' | 'hidden'
  is_featured: boolean
  is_popular: boolean
  tags: string[]
  contact_channels: string[] // ids of ContactChannel
  tutorial_url?: string | null // YouTube tutorial video (canonical watch url)
  terms?: string
  variants: ProductVariant[]
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
}

export interface ContactChannel {
  id: string
  type: string // 'whatsapp' | 'telegram' | 'email' | 'instagram' | 'facebook' | 'custom'
  label: string // display name, e.g. "WhatsApp"
  value: string // phone number, username, url…
  url: string // full click-to-open link
  color: string // tailwind-friendly hex
  sort_order: number
}

export interface Bilingual { en: string; fr: string }

export interface StoreSettings {
  siteName: string
  tagline: string
  currency: string
  defaultLang: 'en' | 'fr'
  brandTagline: string // small text under the navbar site name ("PREMIUM STORE")
  brandTaglineVisible: boolean // show/hide that small text
  siteIcon?: string | null // uploaded favicon / navbar badge image
  // --- Bilingual admin texts (EN/FR) ---
  heroTitle: Bilingual
  heroSubtitle: Bilingual
  heroBadge: string // small pill text above the title (single, not bilingual)
  heroBadgeVisible: boolean
  heroVisible: boolean
  homeSectionNew: Bilingual
  homeSectionTrending: Bilingual
  homeSectionFeatured: Bilingual
  homeSectionCategories: Bilingual
  homeFeaturedCount: number
  homeTrendingCount: number
  // --- Contact ---
  contactWhatsApp: string
  contactTelegram: string
  contactEmail: string
  contactWhatsAppVisible: boolean
  contactTelegramVisible: boolean
  contactEmailVisible: boolean
  contactTitle: Bilingual
  contactSubtitle: Bilingual
  // --- Legal ---
  termsTitle: Bilingual
  privacyTitle: Bilingual
  // --- FAQ ---
  faqTitle: Bilingual
  faqSubtitle: Bilingual
  // --- Dashboard / misc ---
  dashboardTitle: Bilingual
  dashboardDesc: Bilingual
  noProductsTitle: Bilingual
  noProductsDesc: Bilingual
  notFoundTitle: Bilingual
  notFoundDesc: Bilingual
  searchTitle: Bilingual
  searchNoResults: Bilingual
  // --- Homepage control ---
  heroCtaText: string // primary button label
  heroImages: string[] // Netflix-style backdrop images (cycled as slider)
  heroTrending: boolean // show the trending-products slider in the hero
  heroTrendingDesktop: boolean
  heroTrendingMobile: boolean
  sections: SectionConfig[] // ordered, toggleable homepage sections
}

export interface SectionConfig {
  key: string // 'categories' | 'featured' | 'popular' | 'newest' | 'howitworks'
  label: string // admin-facing label
  title: string // section heading shown to visitors
  visible: boolean // master switch
  show_desktop: boolean // render on md+ screens
  show_mobile: boolean // render on small screens
  sort: number
}

export interface StoreData {
  settings: StoreSettings
  categories: Category[]
  products: Product[]
  contacts: ContactChannel[]
}

export interface VisitRecord {
  // product page views
  [slug: string]: { total: number; days: Record<string, number> }
}

// ---------- Storage primitives ----------

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'store.data.json')

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: 'categories', label: 'Categories', title: 'Browse Categories', visible: true, show_desktop: true, show_mobile: true, sort: 1 },
  { key: 'featured', label: 'Featured', title: 'Featured', visible: true, show_desktop: true, show_mobile: true, sort: 2 },
  { key: 'popular', label: 'Popular', title: 'Popular', visible: true, show_desktop: true, show_mobile: true, sort: 3 },
  { key: 'newest', label: 'New Arrivals', title: 'New Arrivals', visible: true, show_desktop: true, show_mobile: true, sort: 4 },
  { key: 'howitworks', label: 'How it works', title: 'How it works', visible: true, show_desktop: true, show_mobile: true, sort: 5 },
]

export const DEFAULT_SETTINGS: StoreSettings = {
  siteName: 'DigitalStore',
  tagline: 'Premium digital products',
  currency: 'DZD',
  defaultLang: 'en',
  brandTagline: 'Premium Store',
  brandTaglineVisible: true,
  siteIcon: null,
  // Bilingual admin texts
  heroTitle: { en: 'Premium Digital Subscriptions', fr: 'Abonnements Digitaux Premium' },
  heroSubtitle: { en: 'Subscriptions, IPTV, software licenses, game cards and gift cards.', fr: 'Abonnements, IPTV, licences logicielles, cartes de jeu et cartes cadeaux.' },
  heroBadge: 'Order directly via WhatsApp • Telegram • No account needed',
  heroBadgeVisible: true,
  heroVisible: true,
  homeSectionNew: { en: 'New Arrivals', fr: 'Nouveautés' },
  homeSectionTrending: { en: 'Trending Now', fr: 'Populaires' },
  homeSectionFeatured: { en: 'Featured', fr: 'Mis en avant' },
  homeSectionCategories: { en: 'Categories', fr: 'Catégories' },
  homeFeaturedCount: 8,
  homeTrendingCount: 8,
  // Contact
  contactWhatsApp: '',
  contactTelegram: '',
  contactEmail: '',
  contactWhatsAppVisible: false,
  contactTelegramVisible: false,
  contactEmailVisible: false,
  contactTitle: { en: 'Need help?', fr: 'Besoin daide ?' },
  contactSubtitle: { en: 'Message us on any platform — we respond fast, no account needed.', fr: 'Écrivez-nous sur nimporte quelle plateforme — réponse rapide, aucun compte requis.' },
  // Legal
  termsTitle: { en: 'Terms of Service', fr: "Conditions d'Utilisation" },
  privacyTitle: { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
  // FAQ
  faqTitle: { en: 'Frequently Asked Questions', fr: 'Foire Aux Questions' },
  faqSubtitle: { en: "Find answers to the most common questions about our store and products.", fr: "Trouvez les réponses aux questions les plus fréquentes sur notre magasin et nos produits." },
  // Dashboard / misc
  dashboardTitle: { en: 'Dashboard', fr: 'Tableau de Bord' },
  dashboardDesc: { en: 'Overview of your store performance.', fr: "Vue densemble des performances de votre magasin." },
  noProductsTitle: { en: 'No Products Yet', fr: "Pas encore de produits" },
  noProductsDesc: { en: 'Check back soon — new products are added regularly.', fr: "Revenez bientôt — de nouveaux produits sont ajoutés régulièrement." },
  notFoundTitle: { en: 'Product Not Found', fr: 'Produit Introuvable' },
  notFoundDesc: { en: "This product may have been removed or the link is invalid.", fr: "Ce produit a peut-être été supprimé ou le lien est invalide." },
  searchTitle: { en: 'Search Results', fr: 'Résultats de Recherche' },
  searchNoResults: { en: 'No results found.', fr: "Aucun résultat trouvé." },
  heroCtaText: 'Explore Products',
  heroImages: [],
  heroTrending: true,
  heroTrendingDesktop: true,
  heroTrendingMobile: true,
  sections: DEFAULT_SECTIONS,
}

const DEFAULT_DATA: StoreData = {
  settings: DEFAULT_SETTINGS,
  categories: [],
  products: [],
  contacts: [],
}

// Cloudflare Workers KV binding (only available when running on Cloudflare via OpenNext).
// Imported dynamically so the module is never loaded on a plain Node host.
export async function getKv(): Promise<KVNamespace | null> {
  try {
    const mod = await import('@opennextjs/cloudflare')
    const ctx = mod.getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (ctx as any)?.env?.KV_BINDING
    return kv || null
  } catch {
    return null
  }
}

async function kvGetStore(): Promise<StoreData | null> {
  const kv = await getKv()
  if (!kv) return null
  const raw = await kv.get('store:data')
  return raw ? (JSON.parse(raw) as StoreData) : DEFAULT_DATA
}

async function kvPutStore(data: StoreData): Promise<boolean> {
  const kv = await getKv()
  if (!kv) return false
  await kv.put('store:data', JSON.stringify(data))
  return true
}

function migrateProduct(p: Product): Product {
  if (!Array.isArray(p.category_ids)) {
    p.category_ids = p.category_id ? [p.category_id] : []
  }
  if (p.category_id && !p.category_ids.includes(p.category_id)) {
    p.category_ids = [p.category_id, ...p.category_ids]
  }
  if (!p.category_id && p.category_ids.length) p.category_id = p.category_ids[0]
  return p
}

function normalizeSettings(s: Partial<StoreSettings> | undefined): StoreSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(s || {}) }
  // keep section list in sync with defaults (new keys get added, removed keys dropped)
  const byKey = new Map(merged.sections.map(x => [x.key, x]))
  merged.sections = DEFAULT_SECTIONS.map(def => {
    const inc = byKey.get(def.key) || {}
    return {
      ...def, ...inc,
      show_desktop: inc.show_desktop ?? def.show_desktop,
      show_mobile: inc.show_mobile ?? def.show_mobile,
    }
  }).sort((a, b) => a.sort - b.sort)
  if (typeof (merged as any).heroTrending !== 'boolean') (merged as any).heroTrending = true
  if (typeof (merged as any).heroTrendingDesktop !== 'boolean') (merged as any).heroTrendingDesktop = true
  if (typeof (merged as any).heroTrendingMobile !== 'boolean') (merged as any).heroTrendingMobile = true
  // defaults for new bilingual keys (only if missing so saved data is preserved)
  if (!merged.heroTitle || typeof merged.heroTitle !== 'object') merged.heroTitle = { ...DEFAULT_SETTINGS.heroTitle }
  if (!merged.heroSubtitle || typeof merged.heroSubtitle !== 'object') merged.heroSubtitle = { ...DEFAULT_SETTINGS.heroSubtitle }
  if (!merged.homeSectionNew || typeof merged.homeSectionNew !== 'object') merged.homeSectionNew = { ...DEFAULT_SETTINGS.homeSectionNew }
  if (!merged.homeSectionTrending || typeof merged.homeSectionTrending !== 'object') merged.homeSectionTrending = { ...DEFAULT_SETTINGS.homeSectionTrending }
  if (!merged.homeSectionFeatured || typeof merged.homeSectionFeatured !== 'object') merged.homeSectionFeatured = { ...DEFAULT_SETTINGS.homeSectionFeatured }
  if (!merged.homeSectionCategories || typeof merged.homeSectionCategories !== 'object') merged.homeSectionCategories = { ...DEFAULT_SETTINGS.homeSectionCategories }
  if (!merged.contactTitle || typeof merged.contactTitle !== 'object') merged.contactTitle = { ...DEFAULT_SETTINGS.contactTitle }
  if (!merged.contactSubtitle || typeof merged.contactSubtitle !== 'object') merged.contactSubtitle = { ...DEFAULT_SETTINGS.contactSubtitle }
  if (!merged.faqTitle || typeof merged.faqTitle !== 'object') merged.faqTitle = { ...DEFAULT_SETTINGS.faqTitle }
  if (!merged.faqSubtitle || typeof merged.faqSubtitle !== 'object') merged.faqSubtitle = { ...DEFAULT_SETTINGS.faqSubtitle }
  if (!merged.termsTitle || typeof merged.termsTitle !== 'object') merged.termsTitle = { ...DEFAULT_SETTINGS.termsTitle }
  if (!merged.privacyTitle || typeof merged.privacyTitle !== 'object') merged.privacyTitle = { ...DEFAULT_SETTINGS.privacyTitle }
  if (!merged.dashboardTitle || typeof merged.dashboardTitle !== 'object') merged.dashboardTitle = { ...DEFAULT_SETTINGS.dashboardTitle }
  if (!merged.dashboardDesc || typeof merged.dashboardDesc !== 'object') merged.dashboardDesc = { ...DEFAULT_SETTINGS.dashboardDesc }
  if (!merged.noProductsTitle || typeof merged.noProductsTitle !== 'object') merged.noProductsTitle = { ...DEFAULT_SETTINGS.noProductsTitle }
  if (!merged.noProductsDesc || typeof merged.noProductsDesc !== 'object') merged.noProductsDesc = { ...DEFAULT_SETTINGS.noProductsDesc }
  if (!merged.notFoundTitle || typeof merged.notFoundTitle !== 'object') merged.notFoundTitle = { ...DEFAULT_SETTINGS.notFoundTitle }
  if (!merged.notFoundDesc || typeof merged.notFoundDesc !== 'object') merged.notFoundDesc = { ...DEFAULT_SETTINGS.notFoundDesc }
  if (!merged.searchTitle || typeof merged.searchTitle !== 'object') merged.searchTitle = { ...DEFAULT_SETTINGS.searchTitle }
  if (!merged.searchNoResults || typeof merged.searchNoResults !== 'object') merged.searchNoResults = { ...DEFAULT_SETTINGS.searchNoResults }
  return merged
}

export async function readStore(): Promise<StoreData> {
  try {
    const fromKv = await kvGetStore()
    if (fromKv) return { ...DEFAULT_DATA, ...fromKv, products: (fromKv.products || []).map(migrateProduct), settings: normalizeSettings(fromKv.settings) }
  } catch { /* fall through to fs */ }
  try {
    if (!fs.existsSync(DATA_FILE)) return { ...DEFAULT_DATA, settings: normalizeSettings(DEFAULT_DATA.settings) }
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw) as StoreData
    return { ...DEFAULT_DATA, ...parsed, products: (parsed.products || []).map(migrateProduct), settings: normalizeSettings(parsed.settings) }
  } catch (err) {
    console.error('[store] failed to read data file:', err)
    return { ...DEFAULT_DATA, settings: normalizeSettings(DEFAULT_DATA.settings) }
  }
}

export async function writeStore(data: StoreData): Promise<void> {
  if (await kvPutStore(data)) return
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmp, DATA_FILE)
}

export async function updateStore(mutate: (d: StoreData) => StoreData): Promise<StoreData> {
  const current = await readStore()
  const next = mutate(structuredClone(current))
  await writeStore(next)
  return next
}

// ---------- Visits ----------

const VISITS_FILE = path.join(DATA_DIR, 'visits.json')
const VISITS_KEY = 'store:visits'

export async function readVisits(): Promise<VisitRecord> {
  try {
    const kv = await getKv()
    if (kv) {
      const raw = await kv.get(VISITS_KEY)
      return raw ? (JSON.parse(raw) as VisitRecord) : {}
    }
    if (!fs.existsSync(VISITS_FILE)) return {}
    return JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8')) as VisitRecord
  } catch { return {} }
}

async function writeVisits(visits: VisitRecord): Promise<void> {
  const kv = await getKv()
  if (kv) {
    await kv.put(VISITS_KEY, JSON.stringify(visits))
    return
  }
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(VISITS_FILE, JSON.stringify(visits), 'utf8')
}

export async function recordVisit(slug: string): Promise<void> {
  try {
    const visits = await readVisits()
    const day = new Date().toISOString().slice(0, 10)
    const rec = visits[slug] || { total: 0, days: {} }
    rec.total += 1
    rec.days[day] = (rec.days[day] || 0) + 1
    visits[slug] = rec
    await writeVisits(visits)
  } catch (err) {
    console.error('[store] visit tracking failed:', err)
  }
}

// ---------- Helpers ----------

export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function contactHref(type: string, value: string): string {
  switch (type) {
    case 'whatsapp': return `https://wa.me/${value.replace(/[^\d]/g, '')}`
    case 'telegram': return `https://t.me/${value.replace(/^@/, '')}`
    case 'email': return `mailto:${value}`
    case 'instagram': return `https://instagram.com/${value.replace(/^@/, '')}`
    case 'facebook': return `https://facebook.com/${value.replace(/^@/, '')}`
    default: return value // custom = full url
  }
}
