import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid, CategoryCard } from '@/app/components/products/product-card'
import { Button } from '@/app/components/ui/ui'
import { getStoreProducts, getAllCategories } from '@/lib/queries'
import { readStore } from '@/lib/store'
import { Zap, Shield, Clock, MessageCircle, Star } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [featuredRes, popularRes, newRes, catsRes, store] = await Promise.all([
    getStoreProducts({ featured: true, limit: 8 }),
    getStoreProducts({ popular: true, limit: 8 }),
    getStoreProducts({ sort: 'newest', limit: 8 }),
    getAllCategories(),
    readStore(),
  ])
  const featured = featuredRes.products
  const popular = popularRes.products
  const newProducts = newRes.products
  const categories = catsRes
  const currency = store.settings.currency || 'DZD'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-600/30 bg-violet-600/10 px-3 py-1 text-xs text-violet-300 mb-6">
                <MessageCircle className="h-3 w-3" /> Order directly via WhatsApp • Telegram • No account needed
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Premium <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Digital Products</span> at the Best Prices
              </h1>
              <p className="mt-4 text-lg text-zinc-400 leading-relaxed">Subscriptions, IPTV, software licenses, game cards and gift cards. Browse, choose your plan, and message us on your favorite app — we handle the rest personally.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop"><Button size="lg" className="rounded-full px-8">Explore Products</Button></Link>
                <Link href="/contact"><Button variant="outline" size="lg" className="rounded-full">Contact Us</Button></Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-zinc-400"><Shield className="h-4 w-4 text-emerald-400"/> Trusted Seller</div>
                <div className="flex items-center gap-2 text-zinc-400"><Clock className="h-4 w-4 text-violet-400"/> Fast Replies</div>
                <div className="flex items-center gap-2 text-zinc-400"><MessageCircle className="h-4 w-4 text-amber-400"/> Order via Chat</div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur-2xl opacity-20" />
              <div className="relative grid grid-cols-2 gap-4">
                {(featured.length ? featured : newProducts).slice(0,4).map((p: any)=>(
                  <div key={String(p.id)} className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                    <img src={p.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'} alt={p.name} className="w-full h-full object-cover" />
                    <div className="p-3">
                      <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                      <div className="text-xs text-violet-400">{Number(p.price).toFixed(2)} {currency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Browse Categories</h2>
            <Link href="/shop" className="text-sm text-violet-400 hover:text-violet-300">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(0,10).map(c=><CategoryCard key={c.id} cat={c} />)}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Zap className="h-5 w-5 text-amber-400" /> Featured</h2>
            <Link href="/shop" className="text-sm text-violet-400 hover:text-violet-300">View all →</Link>
          </div>
          <ProductGrid products={featured as never} />
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Star className="h-5 w-5 text-violet-400" /> Popular</h2>
            <Link href="/shop" className="text-sm text-violet-400 hover:text-violet-300">View all →</Link>
          </div>
          <ProductGrid products={popular as never} />
        </section>
      )}

      {/* Newest */}
      {newProducts.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">New Arrivals</h2>
            <Link href="/shop?sort=newest" className="text-sm text-violet-400 hover:text-violet-300">View all →</Link>
          </div>
          <ProductGrid products={newProducts as never} />
        </section>
      )}

      {/* Empty state */}
      {featured.length === 0 && popular.length === 0 && newProducts.length === 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-xl font-bold text-white mb-2">No products yet</h2>
          <p className="text-zinc-500 text-sm">Products added from the admin panel will appear here.</p>
        </section>
      )}

      {/* How to buy */}
      <section className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl font-bold text-white text-center mb-10">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-violet-600/20 text-violet-300 flex items-center justify-center mx-auto mb-4 text-xl font-black">1</div>
              <h3 className="font-semibold text-white mb-2">Pick a product</h3>
              <p className="text-sm text-zinc-400">Browse the catalog and choose the plan and duration that fits you.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-violet-600/20 text-violet-300 flex items-center justify-center mx-auto mb-4 text-xl font-black">2</div>
              <h3 className="font-semibold text-white mb-2">Message us</h3>
              <p className="text-sm text-zinc-400">Tap WhatsApp, Telegram or any contact button on the product page.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-violet-600/20 text-violet-300 flex items-center justify-center mx-auto mb-4 text-xl font-black">3</div>
              <h3 className="font-semibold text-white mb-2">Get it</h3>
              <p className="text-sm text-zinc-400">We confirm payment and deliver everything in the chat — quick and personal.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
