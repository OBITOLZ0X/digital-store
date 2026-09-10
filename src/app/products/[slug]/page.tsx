import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { Badge, Card, CardContent } from '@/app/components/ui/ui'
import { getProductBySlug, getContactChannels, getSettings } from '@/lib/queries'
import { contactHref, recordVisit } from '@/lib/store'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Shield, Clock } from 'lucide-react'
import { ImageSlider } from '@/app/components/products/image-slider'
import { ProductPurchase } from './product-purchase'

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

            {/* Periods (selectable) + buy box with channels */}
            <ProductPurchase
              variants={variants as never}
              singlePrice={p.price}
              compareAtPrice={p.compare_at_price}
              currency={currency}
              productName={p.name}
              channels={chosen.map(c => ({ id: c.id, label: c.label, type: c.type, url: c.url || contactHref(c.type, c.value), color: c.color }))}
            />

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
