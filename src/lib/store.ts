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
  category_id: string | null
  image_url: string | null
  images: string[] // gallery for the product page slider (first = cover)
  price: number // effective display price (min of variants when multi)
  compare_at_price: number | null
  status: 'active' | 'hidden'
  is_featured: boolean
  is_popular: boolean
  tags: string[]
  contact_channels: string[] // ids of ContactChannel
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

export interface StoreSettings {
  siteName: string
  tagline: string
  currency: string
  siteIcon?: string | null // uploaded favicon / navbar badge image
  // --- Homepage control (admin Settings) ---
  heroBadge: string // small pill text above the title
  heroTitle: string // main headline (markdown-ish plain text)
  heroSubtitle: string // paragraph under the title
  heroCtaText: string // primary button label
  heroImages: string[] // Netflix-style backdrop images (cycled as slider)
  sections: SectionConfig[] // ordered, toggleable homepage sections
}

export interface SectionConfig {
  key: string // 'categories' | 'featured' | 'popular' | 'newest' | 'howitworks'
  label: string // admin-facing label
  title: string // section heading shown to visitors
  visible: boolean
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
  { key: 'categories', label: 'Categories', title: 'Browse Categories', visible: true, sort: 1 },
  { key: 'featured', label: 'Featured', title: 'Featured', visible: true, sort: 2 },
  { key: 'popular', label: 'Popular', title: 'Popular', visible: true, sort: 3 },
  { key: 'newest', label: 'New Arrivals', title: 'New Arrivals', visible: true, sort: 4 },
  { key: 'howitworks', label: 'How it works', title: 'How it works', visible: true, sort: 5 },
]

export const DEFAULT_SETTINGS: StoreSettings = {
  siteName: 'DigitalStore',
  tagline: 'Premium digital products',
  currency: 'DZD',
  siteIcon: null,
  heroBadge: 'Order directly via WhatsApp • Telegram • No account needed',
  heroTitle: 'Premium Digital Products at the Best Prices',
  heroSubtitle: 'Subscriptions, IPTV, software licenses, game cards and gift cards. Browse, choose your plan, and message us on your favorite app — we handle the rest personally.',
  heroCtaText: 'Explore Products',
  heroImages: [],
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

function normalizeSettings(s: Partial<StoreSettings> | undefined): StoreSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(s || {}) }
  if (!Array.isArray(merged.sections) || merged.sections.length === 0) merged.sections = DEFAULT_SECTIONS
  if (!Array.isArray(merged.heroImages)) merged.heroImages = []
  // keep section list in sync with defaults (new keys get added, removed keys dropped)
  const byKey = new Map(merged.sections.map(x => [x.key, x]))
  merged.sections = DEFAULT_SECTIONS.map(def => ({ ...def, ...(byKey.get(def.key) || {}) })).sort((a, b) => a.sort - b.sort)
  return merged
}

export async function readStore(): Promise<StoreData> {
  try {
    const fromKv = await kvGetStore()
    if (fromKv) return { ...DEFAULT_DATA, ...fromKv, settings: normalizeSettings(fromKv.settings) }
  } catch { /* fall through to fs */ }
  try {
    if (!fs.existsSync(DATA_FILE)) return { ...DEFAULT_DATA, settings: normalizeSettings(DEFAULT_DATA.settings) }
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw) as StoreData
    return { ...DEFAULT_DATA, ...parsed, settings: normalizeSettings(parsed.settings) }
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
