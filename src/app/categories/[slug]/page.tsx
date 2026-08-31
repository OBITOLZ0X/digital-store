import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { getStoreProducts } from '@/lib/actions/products'
import { getServerSupabase } from '@/lib/supabase/server-client'

export const runtime = 'edge'


export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  let products: Record<string,unknown>[] = []
  let total = 0
  let catName = slug.replace(/-/g,' ')
  try {
    const s = getServerSupabase()
    const { data: cat } = await s.from('categories').select('name').eq('slug', slug).single()
    if (cat) catName = (cat as {name:string}).name
    const res = await getStoreProducts({ categorySlug: slug, limit: 24 })
    if (res.success) { products=res.data.products; total=res.data.total }
  } catch {}
  if (!products.length) {
    const mock = [
      { id:'1', name:`${catName} Premium 1 Month`, slug:`${slug}-premium-1-month`, images:['https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=300&fit=crop'], price:1200, compare_at_price:1800, is_featured:true, product_type:'subscription', stock:20, category:{name:catName} },
      { id:'2', name:`${catName} Annual Plan`, slug:`${slug}-annual`, images:['https://images.unsplash.com/photo-1593359677879-a4bb92f367d8?w=400&h=300&fit=crop'], price:8500, compare_at_price:12000, is_featured:false, product_type:'subscription', stock:12, category:{name:catName} },
    ]
    products = mock as unknown as Record<string,unknown>[]
    total = mock.length
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-violet-950/30 via-zinc-900 to-zinc-950 p-8 mb-8">
          <h1 className="text-3xl font-black text-white capitalize">{catName}</h1>
          <p className="text-zinc-400 mt-2">{total} products • Instant delivery • Wallet payments</p>
        </div>
        <ProductGrid products={products as never} />
      </div>
      <Footer />
    </div>
  )
}