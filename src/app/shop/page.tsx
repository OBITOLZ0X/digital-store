import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { getStoreProducts } from '@/lib/actions/products'
import Link from 'next/link'

export const runtime = 'edge'


export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }){
  const params = await searchParams
  const sort = params.sort as string | undefined
  const category = params.category as string | undefined
  const q = params.q as string | undefined
  const page = Number(params.page || '1')

  let products: Record<string,unknown>[] = []
  let categories: Record<string,unknown>[] = []
  let total = 0
  try {
    const res = await getStoreProducts({ categorySlug: category, search: q, sort: sort as never, page, limit: 24 })
    if (res.success) { products = res.data.products; categories = res.data.categories; total = res.data.total }
  } catch {}

  // mock fallback
  if (!products.length && !q && !category) {
    const mock = [
      { id:'1', name:'Netflix Premium 1 Month', slug:'netflix-premium-1-month', images:['https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=300&fit=crop'], price: 1200, compare_at_price: 1800, is_featured:true, product_type:'subscription', stock: 42, category:{name:'Subscriptions'} },
      { id:'2', name:'IPTV Premium 12 Months', slug:'iptv-premium-12-months', images:['https://images.unsplash.com/photo-1593359677879-a4bb92f367d8?w=400&h=300&fit=crop'], price: 4500, compare_at_price: 6500, is_featured:true, product_type:'iptv', stock: 18, category:{name:'IPTV'} },
      { id:'3', name:'Windows 11 Pro Key', slug:'windows-11-pro-key', images:['https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&h=300&fit=crop'], price: 2500, compare_at_price: 4000, is_featured:false, product_type:'digital_key', stock: 100, category:{name:'Software'} },
      { id:'4', name:'Spotify Premium 3 Months', slug:'spotify-premium-3-months', images:['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=300&fit=crop'], price: 900, compare_at_price: 1500, is_featured:true, product_type:'subscription', stock: 30, category:{name:'Subscriptions'} },
    ]
    products = mock as unknown as Record<string,unknown>[]
    total = mock.length
  }

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
                {(categories as {slug:string;name:string}[]).map(c=>(
                  <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className={`block py-1 ${category===c.slug?'text-violet-400':'text-zinc-400 hover:text-white'}`}>{c.name}</Link></li>
                ))}
                {!categories.length && ['Subscriptions','IPTV','Software','Gift Cards','VPN','AI Services'].map(n=>(
                  <li key={n}><Link href={`/shop?category=${n.toLowerCase()}`} className="block py-1 text-zinc-400 hover:text-white">{n}</Link></li>
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
              <h1 className="text-2xl font-bold text-white">Shop {category ? `— ${category}` : ''}</h1>
              <span className="text-sm text-zinc-500">{total} products</span>
            </div>
            <ProductGrid products={products as never} />
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