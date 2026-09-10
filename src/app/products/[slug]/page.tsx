import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { Badge, Card, CardContent } from '@/app/components/ui/ui'
import { getProductBySlug, getContactChannels, getSettings } from '@/lib/queries'
import { contactHref, recordVisit } from '@/lib/store'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MessageCircle, Shield, Clock } from 'lucide-react'
import { ContactButtons } from './contact-buttons'
import { ImageSlider } from '@/app/components/products/image-slider'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  const data = await getProductBySlug(slug)
  if (!data) notFound()
  const { product: p, variants, relatedProducts: related } = data
  const [contacts, settings] = await Promise.all([getContactChannels(), getSettings()])
  const currency = settings.currency || 'DZD'
  const chosen = p.contact_channels?.length ? contacts.filter(c => p.contact_channels.includes(c.id)) : contacts

  // visit tracking (product views for the admin dashboard)
  await recordVisit(slug)

  const discount = p.compare_at_price ? Math.round((1 - p.price/p.compare_at_price)*100) : 0

  // TRUE best-value: lowest price per day (shorter plans cost more per day).
  // Ties or missing durations fall back to cheapest absolute price.
  const priced = variants.map(v => ({ ...v, perDay: v.duration_days && v.duration_days > 0 ? Number(v.price) / v.duration_days : null }))
  const withDays = priced.filter(v => v.perDay !== null)
  const bestId = withDays.length
    ? withDays.reduce((a, b) => (b.perDay! < a.perDay! ? b : a)).id
    : (variants.length ? variants.reduce((a, b) => (Number(b.price) < Number(a.price) ? b : a)).id : null)

  const gallery = p.images?.length ? p.images : (p.image_url ? [p.image_url] : [])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-zinc-500 mb-4">
          <Link href="/" className="hover:text-white">Home</Link> / <Link href="/shop" className="hover:text-white">Shop</Link>{p.category ? <> / <Link href={`/categories/${p.category.slug}`} className="hover:text-white">{p.category.name}</Link></> : null} / <span className="text-white">{p.name}</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <ImageSlider images={gallery} alt={p.name} autoMs={4000} className="group" />
            {/* Landing-style benefits */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-2xl border border-white/5 bg-[#111] p-3"><MessageCircle className="h-5 w-5 mx-auto text-[#22d3ee] mb-1"/> Order via chat</div>
              <div className="rounded-2xl border border-white/5 bg-[#111] p-3"><Clock className="h-5 w-5 mx-auto text-[#f5c451] mb-1"/> Fast reply</div>
              <div className="rounded-2xl border border-white/5 bg-[#111] p-3"><Shield className="h-5 w-5 mx-auto text-amber-400 mb-1"/> Trusted seller</div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {p.category && <Badge variant="secondary">{p.category.name}</Badge>}
                {p.is_popular && <Badge variant="success">Popular</Badge>}
                {discount>0 && <Badge variant="destructive">-{discount}%</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-white">{p.name}</h1>
              <p className="text-zinc-400 mt-2">{p.short_description}</p>
            </div>

            {/* Pricing per period — pure landing, no stock */}
            <div>
              <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-[#f5c451]" /> Available periods &amp; prices</h2>
              {variants.length > 0 ? (
                <div className="grid gap-2.5">
                  {priced.map((v, i) => {
                    const isBest = bestId !== null && v.id === bestId
                    return (
                      <div key={v.id || i} className={`flex items-center justify-between rounded-2xl border p-4 transition ${isBest ? 'border-[#f5c451]/60 bg-[#f5c451]/[0.06] shadow-[0_0_25px_rgba(245,196,81,0.15)]' : 'border-white/5 bg-[#111] hover:border-white/10'}`}>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                            {v.name}
                            {isBest && <span className="text-[10px] uppercase tracking-wide bg-[#f5c451] text-black font-bold rounded-full px-2 py-0.5">Best value</span>}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {v.duration_days ? `${v.duration_days} days` : null}
                            {v.perDay !== null && <span className="text-zinc-600"> • {v.perDay.toFixed(2)} {currency}/day</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-black ${isBest ? 'text-[#f5c451]' : 'text-white'}`}>{Number(v.price).toFixed(2)} <span className="text-xs font-normal text-zinc-500">{currency}</span></div>
                          {v.compare_at_price ? <div className="text-xs text-zinc-500 line-through">{Number(v.compare_at_price).toFixed(2)} {currency}</div> : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white">{p.price.toFixed(2)} <span className="text-sm font-normal text-zinc-500">{currency}</span></span>
                  {p.compare_at_price ? <span className="text-lg text-zinc-500 line-through">{p.compare_at_price.toFixed(2)} {currency}</span> : null}
                </div>
              )}
            </div>

            {/* Buy = contact the seller */}
            <Card className="border-[#22d3ee]/25 bg-[#22d3ee]/[0.04]">
              <CardContent className="p-5">
                <h3 className="font-semibold text-white flex items-center gap-2 mb-1"><MessageCircle className="h-4 w-4 text-[#22d3ee]" /> How to buy this product</h3>
                <p className="text-sm text-zinc-400 mb-4">Pick a duration above, then message us on any channel below — tell us the product and period, and we&apos;ll confirm your order in the chat.</p>
                <ContactButtons channels={chosen.map(c => ({ id: c.id, label: c.label, type: c.type, url: c.url || contactHref(c.type, c.value), color: c.color }))} productName={p.name} />
                {chosen.length === 0 && <p className="text-sm text-amber-400">Contact channels are being set up — check back soon.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-white mb-1">Description</h3>
                  <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{p.description || 'Contact us for full details about this product.'}</p>
                </div>
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((t:string)=><Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white mb-6">Related Products</h2>
            <ProductGrid products={related as never} currency={currency} />
          </section>
        )}
      </div>
      <Footer />
    </div>
  )
}
