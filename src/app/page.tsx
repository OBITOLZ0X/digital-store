import Link from 'next/link'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductCard, ProductGrid, CategoryCard } from '@/app/components/products/product-card'
import { Button, Card, CardContent } from '@/app/components/ui/ui'
import { getStoreProducts, getAllCategories } from '@/lib/actions/products'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Zap, Shield, Clock, Headphones, TrendingUp, Star, Tv, Gamepad2, KeyRound, Gift, MonitorSmartphone } from 'lucide-react'



async function getUserAndWallet() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, wallet: null }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const { data: wallet } = await supabase.from('wallets').select('balance,currency').eq('user_id', user.id).single()
    return { user: { id: user.id, email: user.email!, role: (profile as {role:string})?.role || 'customer' }, wallet: wallet as {balance:number;currency:string}|null }
  } catch { return { user: null, wallet: null } }
}

export default async function HomePage() {
  const { user, wallet } = await getUserAndWallet()

  // Fetch products with fallback to mock if Supabase not configured
  let featured: Record<string,unknown>[] = []
  let popular: Record<string,unknown>[] = []
  let categories: Record<string,unknown>[] = []
  let newProducts: Record<string,unknown>[] = []

  try {
    const [f, p, n, cats] = await Promise.all([
      getStoreProducts({ featured: true, limit: 8 }),
      getStoreProducts({ popular: true, limit: 8 }),
      getStoreProducts({ sort: 'newest', limit: 8 }),
      getAllCategories(),
    ])
    if (f.success) featured = f.data.products
    if (p.success) popular = p.data.products
    if (n.success) newProducts = n.data.products
    if (cats.success) categories = cats.data as unknown as Record<string,unknown>[]
  } catch {}

  // DB-only — no hardcoded mocks. Empty states are shown when DB is empty, so deleting in admin actually removes products.

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} balance={wallet ? Number((wallet as {balance:number}).balance) : undefined} currency={wallet?.currency} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-600/30 bg-violet-600/10 px-3 py-1 text-xs text-violet-300 mb-6">
                <Zap className="h-3 w-3" /> Instant Delivery • Wallet Payments • 24/7 Support
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Premium <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Digital Products</span> Instantly
              </h1>
              <p className="mt-4 text-lg text-zinc-400 leading-relaxed">Subscriptions, IPTV, software licenses, game cards and gift cards — delivered instantly to your account. Pay securely with your wallet balance.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop"><Button size="lg" className="rounded-full px-8">Explore Products</Button></Link>
                <Link href="/categories/iptv"><Button variant="outline" size="lg" className="rounded-full">View IPTV</Button></Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-zinc-400"><Shield className="h-4 w-4 text-emerald-400"/> Secure Wallet</div>
                <div className="flex items-center gap-2 text-zinc-400"><Clock className="h-4 w-4 text-violet-400"/> Instant Delivery</div>
                <div className="flex items-center gap-2 text-zinc-400"><Headphones className="h-4 w-4 text-amber-400"/> 24/7 Support</div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur-2xl opacity-20" />
              <div className="relative grid grid-cols-2 gap-4">
                {(featured.length ? featured : newProducts).slice(0,4).map((p: any)=>(
                  <div key={String(p.id)} className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                    <img src={(p.images as string[])?.[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'} alt={String(p.name)} className="w-full aspect-[4/3] object-cover" />
                    <div className="p-3">
                      <div className="text-xs text-zinc-500">{(p.category as {name:string})?.name || ''}</div>
                      <div className="text-sm font-semibold text-white line-clamp-1">{String(p.name)}</div>
                      <div className="text-sm font-bold text-violet-400">{Number(p.price).toFixed(0)} DZD</div>
                    </div>
                  </div>
                ))}
                {(featured.length===0 && newProducts.length===0) && (
                  <div className="col-span-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">No products yet — add one from admin</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div><div className="text-2xl font-black text-white">10K+</div><div className="text-xs text-zinc-500">Happy Customers</div></div>
            <div><div className="text-2xl font-black text-white">50K+</div><div className="text-xs text-zinc-500">Orders Delivered</div></div>
            <div><div className="text-2xl font-black text-white">99.9%</div><div className="text-xs text-zinc-500">Uptime & Delivery</div></div>
            <div><div className="text-2xl font-black text-white">4.8/5</div><div className="text-xs text-zinc-500">Average Rating</div></div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Shop by Category</h2>
            <Link href="/shop" className="text-sm text-violet-400 hover:text-violet-300">View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(categories as {id:string;name:string;slug:string;image_url:string|null;description:string|null}[]).slice(0,6).map(cat=>(
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        </section>

        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Star className="h-5 w-5 text-amber-400"/> Featured Products</h2>
            <Link href="/shop?sort=featured" className="text-sm text-violet-400 hover:text-violet-300">View All →</Link>
          </div>
          <ProductGrid products={featured as never} />
        </section>

        {/* Popular */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-400"/> Popular Now</h2>
            <Link href="/shop?sort=popular" className="text-sm text-violet-400 hover:text-violet-300">View All →</Link>
          </div>
          <ProductGrid products={popular as never} />
        </section>

        {/* New arrivals */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">New Arrivals</h2>
            <Link href="/shop?sort=newest" className="text-sm text-violet-400 hover:text-violet-300">View All →</Link>
          </div>
          <ProductGrid products={newProducts as never} />
        </section>

        {/* Why choose us */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 lg:p-10">
          <h2 className="text-xl font-bold text-white text-center mb-8">Why Choose DigitalStore?</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title:'Instant Delivery', desc:'Products delivered automatically within seconds after payment.' },
              { icon: Shield, title:'Secure Wallet', desc:'No card stored. Pay with your internal wallet balance safely.' },
              { icon: Headphones, title:'24/7 Support', desc:'Our team is here to help you around the clock.' },
              { icon: TrendingUp, title:'Best Prices', desc:'Competitive pricing with regular discounts and coupons.' },
            ].map(f=>(
              <Card key={f.title} className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ teaser */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {[
              { q:'How does wallet payment work?', a:'Top up your wallet via deposit request, wait for admin approval, then spend instantly.' },
              { q:'How fast is delivery?', a:'Automatic products are delivered instantly. Manual products within 24 hours.' },
              { q:'Can I get a refund?', a:'Refunds are handled by admin and credited back to your wallet.' },
              { q:'Is my data secure?', a:'All credentials are encrypted and only visible to you and authorized admins.' },
            ].map(f=>(
              <div key={f.q} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="font-semibold text-white">{f.q}</div>
                <div className="text-zinc-500 mt-1 leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6"><Link href="/faq" className="text-sm text-violet-400 hover:text-violet-300">View full FAQ →</Link></div>
        </section>
      </main>

      <Footer />
    </div>
  )
}