// Storefront chrome — no account UI, no cart, no balance.
import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'
import { Button } from '@/app/components/ui/ui'
import { getAllCategories } from '@/lib/queries'
import { readStore } from '@/lib/store'

export async function Navbar() {
  let cats: { name: string; slug: string }[] = []
  let siteName = 'DigitalStore'
  try {
    const [catsRes, store] = await Promise.all([getAllCategories(), readStore()])
    cats = catsRes.slice(0, 4)
    if (store.settings?.siteName) siteName = store.settings.siteName
  } catch {}

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm">DS</div>
              <span className="font-bold text-lg text-white hidden sm:block">{siteName}</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/shop" className="hover:text-white transition">Shop</Link>
              {cats.map(c => <Link key={c.slug} href={`/categories/${c.slug}`} className="hover:text-white transition">{c.name}</Link>)}
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
            <form action="/search" className="md:hidden">
              <button type="submit" aria-label="Search" className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white"><Search className="h-5 w-5" /></button>
            </form>
            {/* Admin entry point only — customers never log in */}
            <Link href="/admin"><Button variant="secondary" size="sm">Admin</Button></Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export async function Footer() {
  let siteName = 'DigitalStore'
  try { const store = await readStore(); if (store.settings?.siteName) siteName = store.settings.siteName } catch {}
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm">DS</div>
              <span className="font-bold text-white">{siteName}</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">Browse the catalog, pick your plan, and order directly through our social channels. Fast responses, no account needed.</p>
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
            <h4 className="font-semibold text-white mb-3">How to buy</h4>
            <p className="text-zinc-500 leading-relaxed">Open any product, choose your duration, then message us on WhatsApp, Telegram or any channel shown on the product page. We confirm your order there.</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row justify-between gap-4 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <span>Order via WhatsApp / Telegram • No account needed</span>
        </div>
      </div>
    </footer>
  )
}
