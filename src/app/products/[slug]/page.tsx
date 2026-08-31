import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { Button, Badge, Card, CardContent } from '@/app/components/ui/ui'
import { getProductBySlug } from '@/lib/actions/products'
import { Heart, ShoppingCart, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PurchaseBox } from '@/app/products/[slug]/purchase-box'
import { ReviewsSection } from '@/app/components/products/product-reviews'
import { getServerSupabase } from '@/lib/supabase/server-client'



export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  let product: Record<string,unknown> | null = null
  let variants: Record<string,unknown>[] = []
  let related: Record<string,unknown>[] = []
  try {
    const res = await getProductBySlug(slug)
    if (res.success) { product = res.data.product as Record<string,unknown>; variants = res.data.variants as Record<string,unknown>[]; related = res.data.relatedProducts as Record<string,unknown>[] }
  } catch {}
  // DB only — if product not in DB, 404. No hardcoded mocks so admin delete actually removes it.
  if (!product) notFound()

  const p = product as { name:string; slug:string; description:string; short_description:string; images:string[]; price:number; compare_at_price:number|null; stock:number; product_type:string; delivery_type:string; category:{name:string;slug:string}; instructions:string|null; tags:string[] }
  const discount = p.compare_at_price ? Math.round((1 - p.price/ p.compare_at_price)*100) : 0

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-sm text-zinc-500 mb-4">
          <Link href="/" className="hover:text-white">Home</Link> / <Link href="/shop" className="hover:text-white">Shop</Link> / <Link href={`/categories/${p.category?.slug||'subscriptions'}`} className="hover:text-white">{p.category?.name}</Link> / <span className="text-white">{p.name}</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
              <img src={(p.images?.[0]) || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop'} alt={p.name} className="w-full h-full object-cover" />
            </div>
            {p.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {p.images.slice(1,5).map((img,i)=>(<div key={i} className="aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"><img src={img} alt="" className="w-full h-full object-cover" /></div>))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{p.category?.name}</Badge>
                {p.delivery_type==='automatic' && <Badge variant="success">Instant Delivery</Badge>}
                {discount>0 && <Badge variant="destructive">-{discount}%</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-white">{p.name}</h1>
              <p className="text-zinc-400 mt-2">{p.short_description}</p>
              {/* Reviews stars — hidden when reviews_enabled=false */}
              {await (async()=>{
                try{
                  const db=getServerSupabase()
                  const {data}=await db.from('store_settings').select('value').eq('key','reviews_enabled').maybeSingle()
                  const enabled = (data as {value:string|null}|null)?.value === 'true'
                  if(!enabled) return null
                  return (
                    <div className="flex items-center gap-2 mt-3">
                      {Array.from({length:5}).map((_,i)=><span key={i} className={`text-lg ${i<4?'text-amber-400':'text-zinc-700'}`}>★</span>)}
                      <span className="text-sm text-zinc-500">(128 reviews) • 4.8/5</span>
                    </div>
                  )
                }catch{ return null }
              })()}
            </div>
            {variants.length === 0 && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">{p.price.toFixed(2)} <span className="text-sm font-normal text-zinc-500">DZD</span></span>
                {p.compare_at_price && <span className="text-lg text-zinc-500 line-through">{p.compare_at_price.toFixed(2)} DZD</span>}
                {p.compare_at_price && <span className="text-sm font-semibold text-emerald-400">Save {Math.round((1 - p.price/p.compare_at_price)*100)}%</span>}
              </div>
            )}
            
            <div>
                          {(() => {
                            const hasStock = variants.length > 0
                              ? variants.some((v: any) => Number(v.stock) > 0)
                              : Number(p.stock) > 0;
                            const badgeClass = hasStock
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400';
                            const dotClass = hasStock ? 'bg-emerald-400' : 'bg-red-400';
                            const text = variants.length > 0
                              ? (hasStock ? `Available in ${variants.length} options` : 'Out of stock')
                              : (Number(p.stock) > 0 ? `${p.stock} in stock` : 'Out of stock');
                            if (variants.length > 0) return null;
                            return (
                              <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${badgeClass}`}>
                                <span className={`h-2 w-2 rounded-full ${dotClass}`} /> {text}
                              </div>
                            );
                          })()}
                        </div>

            <PurchaseBox product={p as unknown as Record<string,unknown> & {id:string; name:string; price:number; stock:number}} variants={variants as unknown as (Record<string,unknown>&{id:string;name:string;price:number;stock:number;duration_days:number|null})[]} />

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><Shield className="h-5 w-5 mx-auto text-violet-400 mb-1"/> Secure Wallet</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><Clock className="h-5 w-5 mx-auto text-emerald-400 mb-1"/> Instant</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><Heart className="h-5 w-5 mx-auto text-amber-400 mb-1"/> Favorites</div>
            </div>

            <Card>
              <CardContent className="p-5 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-white mb-1">Description</h3>
                  <p className="text-zinc-400 leading-relaxed">{p.description || 'Premium digital product with instant delivery and excellent support.'}</p>
                </div>
                {p.instructions && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                    <div className="font-semibold text-amber-300 text-xs mb-1">Delivery Instructions</div>
                    <div className="text-zinc-400 text-xs leading-relaxed">{p.instructions}</div>
                  </div>
                )}
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span>Type: <b className="text-zinc-300">{p.product_type}</b></span>
                  <span>Delivery: <b className="text-zinc-300">{p.delivery_type}</b></span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white mb-6">Related Products</h2>
            <ProductGrid products={related as never} />
          </section>
        )}
        <ReviewsSection productId={(product as {id:string}).id} productName={p.name} />
      <Footer />
      </div>
    </div>
  )
}