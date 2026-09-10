import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid, CategorySlider } from '@/app/components/products/product-card'
import { Button } from '@/app/components/ui/ui'
import { getStoreProducts, getAllCategories } from '@/lib/queries'
import { readStore } from '@/lib/store'
import { ImageSlider } from '@/app/components/products/image-slider'
import { HeroTrending } from '@/app/components/products/hero-trending'
import { MessageCircle, Shield, Clock, Star, Zap } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const store = await readStore()
  const s = store.settings
  const currency = s.currency || 'DZD'
  const sec = (key: string) => s.sections?.find(x => x.key === key)

  const [featuredRes, popularRes, newRes] = await Promise.all([
    getStoreProducts({ featured: true, limit: 8 }),
    getStoreProducts({ popular: true, limit: 8 }),
    getStoreProducts({ sort: 'newest', limit: 8 }),
  ])
  const featured = featuredRes.products
  const popular = popularRes.products
  const newProducts = newRes.products
  const allActive = store.products.filter(p => p.status === 'active')
  const categories = [...store.categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(c => ({
    ...c,
    products: allActive.filter(p => p.category_id === c.id).slice(0, 6).map(p => ({ image_url: p.image_url, images: p.images || [] })),
  }))

  // hero backdrop: admin-curated images, else featured product covers (Netflix-style)
  const heroImages = s.heroImages?.length
    ? s.heroImages
    : [...featured, ...newProducts].slice(0, 5).map((p: any) => p.image_url).filter(Boolean)

  const ordered = [...(s.sections || [])].sort((a, b) => a.sort - b.sort)

  // top-5 most-visited products for the hero trending slider
  let visits: Record<string, { total: number }> = {}
  try {
    const { readVisits } = await import('@/lib/store')
    visits = await readVisits()
  } catch {}
  const trending = [...store.products]
    .filter(p => p.status === 'active')
    .map(p => ({ id: p.id, name: p.name, slug: p.slug, image_url: p.image_url, views: visits[p.slug]?.total || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    categories: () => categories.length > 0 ? (
      <section key="categories" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-white mb-6">{sec('categories')?.title || 'Browse Categories'}</h2>
        <CategorySlider categories={categories as never} />
      </section>
    ) : null,
    featured: () => featured.length > 0 ? (
      <section key="featured" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6"><Zap className="h-5 w-5 text-[#f5c451]" /> {sec('featured')?.title || 'Featured'}</h2>
        <ProductGrid products={featured as never} currency={currency} />
      </section>
    ) : null,
    popular: () => popular.length > 0 ? (
      <section key="popular" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6"><Star className="h-5 w-5 text-[#22d3ee]" /> {sec('popular')?.title || 'Popular'}</h2>
        <ProductGrid products={popular as never} currency={currency} />
      </section>
    ) : null,
    newest: () => newProducts.length > 0 ? (
      <section key="newest" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <h2 className="text-2xl font-bold text-white mb-6">{sec('newest')?.title || 'New Arrivals'}</h2>
        <ProductGrid products={newProducts as never} currency={currency} />
      </section>
    ) : null,
    howitworks: () => (
      <section key="howitworks" className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl font-bold text-white text-center mb-10">{sec('howitworks')?.title || 'How it works'}</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-white/5 bg-[#111] p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#22d3ee]/10 text-[#22d3ee] flex items-center justify-center mx-auto mb-4 text-xl font-black">1</div>
              <h3 className="font-semibold text-white mb-2">Pick a product</h3>
              <p className="text-sm text-zinc-400">Browse the catalog and choose the plan and duration that fits you.</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#111] p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#22d3ee]/10 text-[#22d3ee] flex items-center justify-center mx-auto mb-4 text-xl font-black">2</div>
              <h3 className="font-semibold text-white mb-2">Message us</h3>
              <p className="text-sm text-zinc-400">Tap WhatsApp, Telegram or any contact button on the product page.</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#111] p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#22d3ee]/10 text-[#22d3ee] flex items-center justify-center mx-auto mb-4 text-xl font-black">3</div>
              <h3 className="font-semibold text-white mb-2">Get it</h3>
              <p className="text-sm text-zinc-400">We confirm payment and deliver everything in the chat — quick and personal.</p>
            </div>
          </div>
        </div>
      </section>
    ),
  }

  const anyProduct = featured.length > 0 || popular.length > 0 || newProducts.length > 0

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Netflix-style hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        {heroImages.length > 0 && (
          <div className="absolute inset-0">
            <ImageSlider images={heroImages as string[]} alt="" aspect="h-full" autoMs={5000} showDots={false} className="!rounded-none !border-0 h-full [&>img]:!object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
          </div>
        )}
        {heroImages.length === 0 && (
          <>
            <div className="absolute inset-0 bg-[#0d0d0d]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,211,238,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(245,196,81,0.10),transparent_55%)]" />
          </>
        )}
        <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${heroImages.length ? 'py-24 lg:py-36' : 'py-16 lg:py-24'}`}>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="max-w-2xl">
            {s.heroBadge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/30 bg-[#22d3ee]/10 px-3 py-1 text-xs text-[#22d3ee] mb-6 backdrop-blur">
                <MessageCircle className="h-3 w-3" /> {s.heroBadge}
              </div>
            )}
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
              {s.heroTitle.split('|').map((part, i) => (
                <span key={i} className={i % 2 === 1 ? 'bg-gradient-to-r from-[#f5c451] to-[#fbbf24] bg-clip-text text-transparent' : ''}>{part.trim()}{i < s.heroTitle.split('|').length - 1 ? ' ' : ''}</span>
              ))}
            </h1>
            <p className="mt-5 text-lg text-zinc-300/90 leading-relaxed">{s.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop"><Button size="lg" className="rounded-full px-8 bg-[#f5c451] text-black hover:bg-[#ffd76e] shadow-[0_0_30px_rgba(245,196,81,0.35)] border-0">{s.heroCtaText || 'Explore Products'}</Button></Link>
              <Link href="/contact"><Button size="lg" className="rounded-full px-8 border-[#22d3ee]/40 text-[#22d3ee] hover:bg-[#22d3ee]/10 hover:text-[#22d3ee]" variant="outline">Contact Us</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-300"><Shield className="h-4 w-4 text-[#f5c451]"/> Trusted Seller</div>
              <div className="flex items-center gap-2 text-zinc-300"><Clock className="h-4 w-4 text-[#22d3ee]"/> Fast Replies</div>
              <div className="flex items-center gap-2 text-zinc-300"><MessageCircle className="h-4 w-4 text-amber-400"/> Order via Chat</div>
            </div>
          </div>
          <HeroTrending products={trending} />
          </div>
        </div>
      </section>

      {/* Ordered, toggleable sections */}
      {ordered.map(x => x.visible ? sectionRenderers[x.key]?.() : null)}

      {/* Empty state */}
      {!anyProduct && categories.length === 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-xl font-bold text-white mb-2">No products yet</h2>
          <p className="text-zinc-500 text-sm">Products added from the admin panel will appear here.</p>
        </section>
      )}

      <Footer />
    </div>
  )
}
