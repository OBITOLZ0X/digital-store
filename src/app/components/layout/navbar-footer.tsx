'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, Search, Wallet, User, Menu, X, Heart, LogOut, LayoutDashboard, Globe } from 'lucide-react'
import { Button } from '@/app/components/ui/ui'
import { createClient } from '@/lib/supabase/client'

export function Navbar({ user: initialUser, balance: initialBalance, currency: initialCurrency, lang }: { user?: { id:string; email:string; role:string } | null; balance?: number; currency?: string; lang?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(initialUser ?? null)
  const [balance, setBalance] = useState<number | undefined>(initialBalance)
  const [currency, setCurrency] = useState(initialCurrency ?? 'DZD')
  useEffect(()=>{
    if(initialUser) { setUser(initialUser); if(initialBalance!==undefined) setBalance(initialBalance); if(initialCurrency) setCurrency(initialCurrency); return }
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: u } })=>{
      if(!u) return
      setUser({ id: u.id, email: u.email!, role: (u.user_metadata as {role?:string})?.role || 'customer' })
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', u.id).single()
      if(profile) setUser(prev=> prev ? { ...prev, role: (profile as {role:string}).role } : prev)
      const { data: wallet } = await supabase.from('wallets').select('balance,currency').eq('user_id', u.id).single()
      if(wallet) { setBalance(Number((wallet as {balance:number}).balance)); setCurrency((wallet as {currency:string}).currency) }
    })
  },[initialUser, initialBalance, initialCurrency])
  const isAdmin = user && ['admin','super_admin'].includes((user as {role:string}).role)
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm">DS</div>
              <span className="font-bold text-lg text-white hidden sm:block">DigitalStore</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/shop" className="hover:text-white transition">Shop</Link>
              <Link href="/categories/subscriptions" className="hover:text-white transition">Subscriptions</Link>
              <Link href="/categories/iptv" className="hover:text-white transition">IPTV</Link>
              <Link href="/categories/software" className="hover:text-white transition">Software</Link>
              <Link href="/faq" className="hover:text-white transition">FAQ</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
            </nav>
          </div>
          <div className="flex-1 max-w-md hidden md:block">
            <form action="/search" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input name="q" placeholder="Search products..." className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-600" />
            </form>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/account/wallet" className="hidden sm:flex items-center gap-2 rounded-xl bg-violet-600/20 border border-violet-600/30 px-3 py-2 text-sm text-violet-300">
                  <Wallet className="h-4 w-4" /> {balance?.toFixed(2) ?? '0.00'} {currency ?? 'DZD'}
                </Link>
                <Link href="/account/favorites" className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white"><Heart className="h-5 w-5" /></Link>
                <Link href="/account" className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white"><User className="h-5 w-5" /></Link>
                {isAdmin && <Link href="/admin" className="hidden sm:inline-flex"><Button variant="secondary" size="sm"><LayoutDashboard className="h-4 w-4" /> Admin</Button></Link>}
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link href="/register"><Button size="sm">Register</Button></Link>
              </>
            )}
            <Link href="/cart" className="relative p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <button onClick={()=>setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-xl hover:bg-zinc-800 text-zinc-400">
              {mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t border-zinc-800 py-4 space-y-3">
            <form action="/search" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input name="q" placeholder="Search..." className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-white" />
            </form>
            <nav className="flex flex-col gap-2 text-sm text-zinc-300">
              <Link href="/shop" className="py-2 hover:text-white">Shop</Link>
              <Link href="/categories/subscriptions" className="py-2 hover:text-white">Subscriptions</Link>
              <Link href="/categories/iptv" className="py-2 hover:text-white">IPTV</Link>
              <Link href="/faq" className="py-2 hover:text-white">FAQ</Link>
              <Link href="/contact" className="py-2 hover:text-white">Contact</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm">DS</div>
              <span className="font-bold text-white">DigitalStore</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">Premium digital products marketplace. Instant delivery, secure wallet payments, 24/7 support.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Categories</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link href="/categories/subscriptions" className="hover:text-white">Subscriptions</Link></li>
              <li><Link href="/categories/iptv" className="hover:text-white">IPTV</Link></li>
              <li><Link href="/categories/software" className="hover:text-white">Software</Link></li>
              <li><Link href="/categories/gift-cards" className="hover:text-white">Gift Cards</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-zinc-500">
              <li>support@digitalstore.com</li>
              <li>+213 555 00 00 00</li>
              <li>Algiers, Algeria</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row justify-between gap-4 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} DigitalStore. All rights reserved.</span>
          <span>Wallet-based payments • No Stripe • Secure & Instant</span>
        </div>
      </div>
    </footer>
  )
}
