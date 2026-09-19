// Storefront chrome — CineFlow-style premium navbar.
import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'
import { getAllCategories } from '@/lib/queries'
import { readStore } from '@/lib/store'
import { NavbarSearch, NavbarMobile } from './navbar-client'
import { LanguageSwitcher } from './language-switcher'
import { getLang } from '@/lib/i18n/server'
import { t, type Lang } from '@/lib/i18n'

export async function Navbar() {
  let cats: { name: string; slug: string }[] = []
  let siteName = 'DigitalStore'
  let siteIcon: string | null = null
  let brandTagline = 'Premium Store'
  let brandTaglineVisible = true
  let lang: Lang = 'en'
  try {
    const [catsRes, store] = await Promise.all([getAllCategories(), readStore()])
    cats = catsRes.slice(0, 4)
    if (store.settings?.siteName) siteName = store.settings.siteName
    siteIcon = store.settings?.siteIcon || null
    if (store.settings?.brandTagline !== undefined) brandTagline = store.settings.brandTagline
    brandTaglineVisible = store.settings?.brandTaglineVisible !== false
  } catch {}
  try { lang = await getLang() } catch {}

  // two-tone wordmark: first part white, last part gold
  // two-tone split: multi-word -> last word gold; single CamelCase word -> split at inner uppercase; fallback = half
  function splitName(name: string): [string, string] {
    const n = name.trim()
    const words = n.split(/\s+/)
    if (words.length > 1) return [words.slice(0, -1).join(' '), words[words.length - 1]]
    const m = n.match(/^(.*[a-z])([A-Z].*)$/)
    if (m) return [m[1], m[2]]
    const half = Math.max(1, Math.ceil(n.length / 2))
    return [n.slice(0, half), n.slice(half)]
  }
  const [nameFirst, nameGold] = splitName(siteName)
  const T = (k: string) => t(lang, k)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          {/* Brand: icon badge + two-tone name + tagline */}
          <Link href="/" className="group flex items-center gap-3 shrink-0">
            {siteIcon ? (
              <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-[#f5c451]/80 shadow-[0_0_15px_rgba(245,196,81,0.35)]">
                <img src={siteIcon} alt={siteName} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl border-2 border-[#f5c451]/80 bg-[#111] flex items-center justify-center font-black text-[#f5c451] text-base shadow-[0_0_15px_rgba(245,196,81,0.35)]">
                {siteName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="leading-none">
              <div className="font-extrabold text-base sm:text-lg tracking-wide text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-none">
                {nameFirst.toUpperCase()}<span className="text-[#f5c451]">{nameGold.toUpperCase()}</span>
              </div>
              {/* tagline row keeps its height even when hidden so the name never shifts */}
              <div className={`text-[9px] tracking-[0.25em] text-zinc-500 uppercase mt-1 h-3 ${brandTaglineVisible ? '' : 'invisible'}`}>{brandTagline || ' '}</div>
            </div>
          </Link>

          {/* Center nav */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] text-zinc-300">
            <Link href="/shop" className="hover:text-[#f5c451] transition">{T('nav.shop')}</Link>
            {cats.slice(0, 3).map(c => <Link key={c.slug} href={`/categories/${c.slug}`} className="hover:text-[#f5c451] transition">{c.name}</Link>)}
            <Link href="/faq" className="hover:text-[#f5c451] transition">{T('nav.faq')}</Link>
            <Link href="/contact" className="hover:text-[#f5c451] transition">{T('nav.contact')}</Link>
          </nav>

          {/* Right CTAs: search expandable + Shop (gold) + language */}
          <div className="flex items-center gap-2.5">
            {/* Expandable search — collapsed icon, expands to input on click (client) */}
            <NavbarSearch lang={lang} />
            <LanguageSwitcher lang={lang} />
            <Link href="/shop"
              className="hidden sm:inline-flex items-center rounded-full bg-[#f5c451] px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_25px_rgba(245,196,81,0.45)] transition hover:bg-[#ffd76e] hover:shadow-[0_0_35px_rgba(245,196,81,0.6)]">
              {T('nav.shop')}
            </Link>
            {/* Mobile menu toggle */}
            <NavbarMobile cats={cats} siteName={siteName} siteIcon={siteIcon} lang={lang} />
          </div>
        </div>
      </div>
    </header>
  )
}

export async function Footer({ lang = 'en' as Lang }: { lang?: Lang }) {
  let siteName = 'DigitalStore'
  let siteIcon: string | null = null
  try { const store = await readStore(); if (store.settings?.siteName) siteName = store.settings.siteName; siteIcon = store.settings?.siteIcon || null } catch {}
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {siteIcon ? (
                <img src={siteIcon} alt={siteName} className="h-8 w-8 rounded-xl object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#f5c451] to-[#b8860b] flex items-center justify-center font-black text-black text-sm">{siteName.charAt(0).toUpperCase()}</div>
              )}
              <span className="font-bold text-white">{siteName}</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">{t(lang, 'footer.about')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">{t(lang, 'footer.quickLinks')}</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><Link href="/shop" className="hover:text-white">{t(lang, 'nav.shop')}</Link></li>
              <li><Link href="/faq" className="hover:text-white">{t(lang, 'nav.faq')}</Link></li>
              <li><Link href="/contact" className="hover:text-white">{t(lang, 'nav.contact')}</Link></li>
              <li><Link href="/terms" className="hover:text-white">{t(lang, 'footer.terms')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white">{t(lang, 'footer.privacy')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">{t(lang, 'footer.howToBuy')}</h4>
            <p className="text-zinc-500 leading-relaxed">{t(lang, 'footer.howToBuyText')}</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} {siteName}. {t(lang, 'footer.rights')}</span>
          <span>{t(lang, 'footer.orderVia')}</span>
        </div>
      </div>
    </footer>
  )
}