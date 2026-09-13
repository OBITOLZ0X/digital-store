import { readStore, contactHref, generateId, type Product, type Category, type ContactChannel, type StoreSettings } from './store'

export interface StoreProduct {
  id: string
  slug: string
  name: string
  description: string
  short_description: string
  category: { id: string; name: string; slug: string } | null
  categories: { id: string; name: string; slug: string }[]
  category_id: string | null
  category_ids: string[]
  image_url: string | null
  images: string[]
  price: number
  compare_at_price: number | null
  is_featured: boolean
  is_popular: boolean
  tags: string[]
  variants: { id: string; name: string; duration_days: number | null; price: number; compare_at_price?: number | null }[]
  contact_channels: string[]
  tutorial_url?: string | null
  created_at: string
}

function prodCategoryIds(p: Product): string[] {
  if (Array.isArray(p.category_ids) && p.category_ids.length) return p.category_ids
  return p.category_id ? [p.category_id] : []
}

function toStoreProduct(p: Product, catsById: Map<string, Category>): StoreProduct {
  const ids = prodCategoryIds(p)
  const cats = ids.map(id => catsById.get(id)).filter(Boolean) as Category[]
  const primary = cats[0] || null
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description || '',
    short_description: p.short_description || '',
    category: primary ? { id: primary.id, name: primary.name, slug: primary.slug } : null,
    categories: cats.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
    category_id: p.category_id,
    category_ids: ids,
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
  const catsById = new Map(store.categories.map(c => [c.id, c]))
  let list = store.products.filter(p => p.status === 'active')

  if (options?.featured) list = list.filter(p => p.is_featured)
  if (options?.popular) list = list.filter(p => p.is_popular)
  if (options?.categorySlug) {
    const cat = store.categories.find(c => c.slug === options.categorySlug)
    if (cat) list = list.filter(p => prodCategoryIds(p).includes(cat.id))
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
    default: break
  }

  const total = list.length
  const page = options?.page || 1
  const limit = options?.limit || 24
  const paged = list.slice((page - 1) * limit, page * limit)

  return { products: paged.map(p => toStoreProduct(p, catsById)), total }
}

export async function getProductBySlug(slug: string): Promise<{
  product: StoreProduct
  variants: StoreProduct['variants']
  relatedProducts: StoreProduct[]
} | null> {
  const store = await readStore()
  const catsById = new Map(store.categories.map(c => [c.id, c]))
  const p = store.products.find(x => x.slug === slug && x.status === 'active')
  if (!p) return null
  const myCats = prodCategoryIds(p)
  const related = store.products
    .filter(x => x.status === 'active' && x.id !== p.id && prodCategoryIds(x).some(id => myCats.includes(id)))
    .slice(0, 4)
  return {
    product: toStoreProduct(p, catsById),
    variants: p.variants,
    relatedProducts: related.map(x => toStoreProduct(x, catsById)),
  }
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

export { contactHref, generateId }
