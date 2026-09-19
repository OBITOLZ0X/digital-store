// Store landing — bilingual hero, sections, products, contacts.
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid, CategorySlider } from '@/app/components/products/product-card'
import { Button } from '@/app/components/ui/ui'
import { getStoreProducts, getAllCategories } from '@/lib/queries'
import { readStore } from '@/lib/store'
import { ImageSlider } from '@/app/components/products/image-slider'
import { HeroTrending } from '@/app/components/products/hero-trending'
import { getLang } from '@/lib/i18n/server'
import { t } from '@/lib/i18n'
import { MessageCircle, Shield, Clock, Star, Zap } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function splitBilingual(value: any, key: string): string {
  if (!value) return ''
  if (typeof value === 'object' && value !== null && key in value) return String(value[key])
  if (typeof value === 'string') return value
  return ''
}

function sectionTitle(s: any, key: string, fallback: string): string {
  const def = s?.sections?.find((x: any) => x.key === key)
  return def?.title || fallback
}

export default async function HomePage() {
  const store = await readStore()
  const s = store.settings
  const currency = s.currency || 'DZD'
  let lang: 'en' | 'fr' = 'en'
  try { lang = await getLang() } catch {}
  const T = (k: string) => t(lang, k)

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
    products: allActive.filter(p => (p.category_ids?.length ? p.category_ids.includes(c.id) : p.category_id === c.id)).slice(0, 6).map(p => ({ image_url: p.image_url, images: p.images || [] })),
  }))

  const heroImages = s.heroImages?.length
    ? s.heroImages
    : [...featured, ...newProducts].slice(0, 5).map((p: any) => p.image_url).filter(Boolean)

  const ordered = [...(s.sections || [])].sort((a, b) => a.sort - b.sort)

  let visits: Record<string, { total: number }> = {}
  try {
    const { readVisits } = await import('@/lib/store')
    visits = await readVisits()
  } catch {}
  const trending = [...store.products]
    .filter(p => p.status === 'active')
    .map(p => ({ id: p.id, name: p.name, slug: p.slug, image_url: p.image_url, views: visits[p.slug]?.total || 0, price: p.price }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  const deviceClass = (d: boolean, m: boolean) =>
    d && m ? '' : d ? 'hidden md:block' : m ? 'md:hidden' : 'hidden'
  const heroSliderClass = s.heroTrending === false ? 'hidden' : deviceClass(s.heroTrendingDesktop !== false, s.heroTrendingMobile !== false)

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    categories: () => categories.length > 0 ? (
      <section key="categories" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-white mb-6">{sectionTitle(s, 'categories', T('home.categories'))}</h2>
        <CategorySlider categories={categories as never} />
      </section>
    ) : null,
    featured: () => featured.length > 0 ? (
      <section key="featured" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6"><Zap className="h-5 w-5 text-[#f5c451]" /> {sectionTitle(s, 'featured', T('home.featured'))}</h2>
        <ProductGrid products={featured as never} currency={currency} />
      </section>
    ) : null,
    popular: () => popular.length > 0 ? (
      <section key="popular" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6"><Star className="h-5 w-5 text-[#22d3ee]" /> {sectionTitle(s, 'popular', T('home.trending'))}</h2>
        <ProductGrid products={popular as never} currency={currency} />
      </section>
    ) : null,
    newest: () => newProducts.length > 0 ? (
      <section key="newest" className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <h2 className="text-2xl font-bold text-white mb-6">{sectionTitle(s, 'newest', T('home.new'))}</h2>
        <ProductGrid products={newProducts as never} currency={currency} />
      </section>
    ) : null,
    howitworks: () => (
      <section key="howitworks" className="border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-2xl font-bold text-white text-center mb-10">{T('home.how')}</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-white/5 bg-[#111] p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#22d3ee]/10 text-[#22d3ee] flex items-center justify-center mx-auto mb-4 text-xl font-black">1</div>
              <h3 className="font-semibold text-white mb-2">{T('home.howPick')}</h3>
              <p className="text-sm text-zinc-400">{T('home.howPickDesc')}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#111] p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#22d3ee]/10 text-[#22d3ee] flex items-center justify-center mx-auto mb-4 text-xl font-black">2</div>
              <h3 className="font-semibold text-white mb-2">{T('home.howMsg')}</h3>
              <p className="text-sm text-zinc-400">{T('home.howMsgDesc')}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#111] p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#22d3ee]/10 text-[#22d3ee] flex items-center justify-center mx-auto mb-4 text-xl font-black">3</div>
              <h3 className="font-semibold text-white mb-2">{T('home.howGet')}</h3>
              <p className="text-sm text-zinc-400">{T('home.howGetDesc')}</p>
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
        <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${heroImages.length ? 'py-16 sm:py-24 lg:py-36' : 'py-12 sm:py-16 lg:py-24'}`}>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-center">
            <div className="max-w-2xl">
              {s.heroBadge && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/30 bg-[#22d3ee]/10 px-3 py-1 text-xs text-[#22d3ee] mb-5 sm:mb-6 backdrop-blur">
                  <MessageCircle className="h-3 w-3" /> {s.heroBadge}
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
                {splitBilingual(s.heroTitle, lang) || s.heroTitle.split('|').map((part: string, i: number) => (
                  <span key={i} className={i % 2 === 1 ? 'bg-gradient-to-r from-[#f5c451] to-[#fbbf24] bg-clip-text text-transparent' : ''}>{part.trim()}{i < s.heroTitle.split('|').length - 1 ? ' ' : ''}</span>
                ))}
              </h1>
              <p className="mt-4 sm:mt-5 text-base sm:text-lg text-zinc-300/90 leading-relaxed">{splitBilingual(s.heroSubtitle, lang) || s.heroSubtitle}</p>
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
                <Link href="/shop"><Button size="lg" className="rounded-full px-8 bg-[#f5c451] text-black hover:bg-[#ffd76e] shadow-[0_0_30px_rgba(245,196,81,0.35)] border-0">{s.heroCtaText || 'Explore Products'}</Button></Link>
                <Link href="/contact"><Button size="lg" className="rounded-full px-8 border-[#22d3ee]/40 text-[#22d3ee] hover:bg-[#22d3ee]/10 hover:text-[#22d3ee]" variant="outline">{T('home.contactUs')}</Button></Link>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-2 text-zinc-300"><Shield className="h-4 w-4 text-[#f5c451]"/> Trusted Seller</div>
                <div className="flex items-center gap-2 text-zinc-300"><Clock className="h-4 w-4 text-[#22d3ee]"/> Fast Replies</div>
                <div className="flex items-center gap-2 text-zinc-300"><MessageCircle className="h-4 w-4 text-amber-400"/> {T('home.orderVia')}</div>
              </div>
            </div>
            {trending.length > 0 && (
              <div className={heroSliderClass}>
                <div className="group"><HeroTrending products={trending} currency={currency} /></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ordered, toggleable sections (with PC/mobile visibility) */}
      {ordered.map(x => {
        if (!x.visible) return null
        const node = sectionRenderers[x.key]?.()
        if (!node) return null
        const cls = deviceClass(x.show_desktop !== false, x.show_mobile !== false)
        return <div key={x.key} className={cls}>{node}</div>
      })}

      {/* Empty state */}
      {!anyProduct && categories.length === 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-xl font-bold text-white mb-2">{T('home.noProducts')}</h2>
          <p className="text-zinc-500 text-sm">{T('home.noProductsDesc')}</p>
        </section>
      )}

      <Footer lang={lang} />
    </div>
  )
}