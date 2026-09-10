// Storefront/admin read helpers on top of the JSON store.
import { readStore, contactHref, type Product, type Category, type ContactChannel, type StoreSettings } from './store'

export interface StoreProduct {
  id: string
  slug: string
  name: string
  description: string
  short_description: string
  category: { id: string; name: string; slug: string } | null
  category_id: string | null
  image_url: string | null
  images: string[]
  price: number
  compare_at_price: number | null
  is_featured: boolean
  is_popular: boolean
  tags: string[]
  variants: { id: string; name: string; duration_days: number | null; price: number; compare_at_price?: number | null }[]
  contact_channels: string[]
  tutorial_url: string | null
  created_at: string
}

export async function getStoreProducts(options?: {
  categorySlug?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
  featured?: boolean
  popular?: boolean
}): Promise<{ products: StoreProduct[]; total: number }> {
  const store = await readStore()
  let list = store.products.filter(p => p.status === 'active')

  if (options?.featured) list = list.filter(p => p.is_featured)
  if (options?.popular) list = list.filter(p => p.is_popular)
  if (options?.categorySlug) {
    const cat = store.categories.find(c => c.slug === options.categorySlug)
    if (cat) list = list.filter(p => p.category_id === cat.id)
    else list = []
  }
  if (options?.search) {
    const q = options.search.toLowerCase().trim()
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || (p.short_description || '').toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)))
  }

  switch (options?.sort) {
    case 'price_asc': list.sort((a, b) => a.price - b.price); break
    case 'price_desc': list.sort((a, b) => b.price - a.price); break
    case 'newest': list.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
    case 'popular': list.sort((a, b) => Number(b.is_popular) - Number(a.is_popular)); break
    default: /* keep insertion order */ break
  }

  const total = list.length
  const page = options?.page || 1
  const limit = options?.limit || 24
  const paged = list.slice((page - 1) * limit, page * limit)

  return { products: paged.map(toStoreProduct), total }
}

export async function getProductBySlug(slug: string): Promise<{
  product: StoreProduct
  variants: StoreProduct['variants']
  relatedProducts: StoreProduct[]
} | null> {
  const store = await readStore()
  const p = store.products.find(x => x.slug === slug && x.status === 'active')
  if (!p) return null
  const cat = store.categories.find(c => c.id === p.category_id)
  const related = store.products.filter(x => x.status === 'active' && x.id !== p.id && x.category_id === p.category_id).slice(0, 4)
  return { product: toStoreProduct(p, cat), variants: p.variants, relatedProducts: related.map(x => toStoreProduct(x)) }
}

export async function getAllCategories(): Promise<Category[]> {
  const store = await readStore()
  return [...store.categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export async function getContactChannels(): Promise<ContactChannel[]> {
  const store = await readStore()
  return [...store.contacts].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export async function getSettings(): Promise<StoreSettings> {
  const store = await readStore()
  return store.settings
}

export function toStoreProduct(p: Product, cat?: Category): StoreProduct {
  const c = cat || null
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description || '',
    short_description: p.short_description || '',
    category: c ? { id: c.id, name: c.name, slug: c.slug } : null,
    category_id: p.category_id,
    image_url: p.image_url,
    images: p.images && p.images.length ? p.images : (p.image_url ? [p.image_url] : []),
    price: p.price,
    compare_at_price: p.compare_at_price,
    is_featured: !!p.is_featured,
    is_popular: !!p.is_popular,
    tags: p.tags || [],
    variants: p.variants || [],
    contact_channels: p.contact_channels || [],
    tutorial_url: p.tutorial_url || null,
    created_at: p.created_at,
  }
}

export { contactHref }
