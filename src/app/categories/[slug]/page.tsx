import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { getStoreProducts, getAllCategories, getSettings } from '@/lib/queries'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  const categories = await getAllCategories()
  const cat = categories.find(c=>c.slug===slug)
  if (!cat) notFound()

  const [res, settings] = await Promise.all([
    getStoreProducts({ categorySlug: slug, limit: 24 }),
    getSettings(),
  ])
  const products = res.products
  const currency = settings.currency || 'DZD'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-violet-950/30 via-zinc-900 to-zinc-950 p-8 mb-8">
          <h1 className="text-3xl font-black text-white">{cat.name}</h1>
          <p className="text-zinc-400 mt-2">{res.total} products • Pick a plan and order via WhatsApp, Telegram or your favorite app</p>
        </div>
        <ProductGrid products={products as never} currency={currency} />
      </div>
      <Footer />
    </div>
  )
}
