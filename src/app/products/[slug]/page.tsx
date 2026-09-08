import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { Badge, Card, CardContent } from '@/app/components/ui/ui'
import { getProductBySlug, getContactChannels, getSettings } from '@/lib/queries'
import { contactHref, recordVisit } from '@/lib/store'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MessageCircle, Shield, Clock } from 'lucide-react'
import { ContactButtons } from './contact-buttons'

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-zinc-500 mb-4">
          <Link href="/" className="hover:text-white">Home</Link> / <Link href="/shop" className="hover:text-white">Shop</Link>{p.category ? <> / <Link href={`/categories/${p.category.slug}`} className="hover:text-white">{p.category.name}</Link></> : null} / <span className="text-white">{p.name}</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
              <img src={p.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop'} alt={p.name} className="w-full h-full object-cover" />
            </div>
            {/* Landing-style benefits */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><MessageCircle className="h-5 w-5 mx-auto text-violet-400 mb-1"/> Order via chat</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><Clock className="h-5 w-5 mx-auto text-emerald-400 mb-1"/> Fast reply</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><Shield className="h-5 w-5 mx-auto text-amber-400 mb-1"/> Trusted seller</div>
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
              <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-violet-400" /> Available periods &amp; prices</h2>
              {variants.length > 0 ? (
                <div className="grid gap-2.5">
                  {variants.map((v, i) => {
                    const isBest = variants.length > 1 && Number(v.price) === Math.min(...variants.map(x=>Number(x.price)))
                    return (
                      <div key={v.id || i} className={`flex items-center justify-between rounded-2xl border p-4 ${isBest ? 'border-violet-600/50 bg-violet-600/5' : 'border-zinc-800 bg-zinc-900'}`}>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {v.name}
                            {isBest && <span className="text-[10px] uppercase tracking-wide bg-violet-600/20 text-violet-300 border border-violet-600/30 rounded-full px-2 py-0.5">Best value</span>}
                          </div>
                          {v.duration_days ? <div className="text-xs text-zinc-500 mt-0.5">{v.duration_days} days</div> : null}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-white">{Number(v.price).toFixed(2)} <span className="text-xs font-normal text-zinc-500">{currency}</span></div>
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
            <Card className="border-violet-600/30 bg-violet-950/20">
              <CardContent className="p-5">
                <h3 className="font-semibold text-white flex items-center gap-2 mb-1"><MessageCircle className="h-4 w-4 text-violet-400" /> How to buy this product</h3>
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
