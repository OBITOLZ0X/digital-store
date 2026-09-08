import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { getStoreProducts, getAllCategories, getSettings } from '@/lib/queries'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }){
  const params = await searchParams
  const sort = params.sort as string | undefined
  const category = params.category as string | undefined
  const q = params.q as string | undefined
  const page = Number(params.page || '1')

  const [res, categories, settings] = await Promise.all([
    getStoreProducts({ categorySlug: category, search: q, sort, page, limit: 24 }),
    getAllCategories(),
    getSettings(),
  ])
  const products = res.products
  const total = res.total
  const currency = settings.currency || 'DZD'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0 space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="font-semibold text-white mb-3">Categories</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shop" className={`block py-1 ${!category?'text-violet-400':'text-zinc-400 hover:text-white'}`}>All Products</Link></li>
                {categories.map(c=>(
                  <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className={`block py-1 ${category===c.slug?'text-violet-400':'text-zinc-400 hover:text-white'}`}>{c.name}</Link></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="font-semibold text-white mb-3">Sort By</h3>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/shop" className={`py-1 ${!sort?'text-violet-400':'text-zinc-400'}`}>Featured</Link>
                <Link href="/shop?sort=price_asc" className={`py-1 ${sort==='price_asc'?'text-violet-400':'text-zinc-400'}`}>Price: Low to High</Link>
                <Link href="/shop?sort=price_desc" className={`py-1 ${sort==='price_desc'?'text-violet-400':'text-zinc-400'}`}>Price: High to Low</Link>
                <Link href="/shop?sort=newest" className={`py-1 ${sort==='newest'?'text-violet-400':'text-zinc-400'}`}>Newest</Link>
              </div>
            </div>
          </aside>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Shop {category ? `— ${categories.find(c=>c.slug===category)?.name || category}` : ''}</h1>
              <span className="text-sm text-zinc-500">{total} product{total===1?'':'s'}</span>
            </div>
            <ProductGrid products={products as never} currency={currency} />
            {total > 24 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({length: Math.ceil(total/24)}).map((_,i)=>(
                  <Link key={i} href={`/shop?page=${i+1}${sort?`&sort=${sort}`:''}${category?`&category=${category}`:''}`} className={`px-4 py-2 rounded-xl border text-sm ${page===i+1?'bg-violet-600 border-violet-600 text-white':'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'}`}>{i+1}</Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
