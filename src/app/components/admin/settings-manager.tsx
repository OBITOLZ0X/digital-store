// Admin settings: site brand + EN/FR admin text translations
'use client'
import { useState } from 'react'
import { Save, Globe, MessageSquare } from 'lucide-react'
import { Button } from '@/app/components/ui/ui'
import { t, type Lang } from '@/lib/i18n'
import { LANGS } from '@/lib/i18n'

export function SettingsManager({ initial }: {
  initial?: {
    siteName: string; brandTagline: string; brandTaglineVisible: boolean; siteIcon: string | null; defaultLang: Lang
    heroTitle: { en: string; fr: string }; heroSubtitle: { en: string; fr: string }
    heroBadge: string; heroBadgeVisible: boolean; heroVisible: boolean
    homeSectionNew: { en: string; fr: string }; homeSectionTrending: { en: string; fr: string }
    homeSectionFeatured: { en: string; fr: string }; homeSectionCategories: { en: string; fr: string }
    homeFeaturedCount: number; homeTrendingCount: number
    contactWhatsApp: string; contactTelegram: string; contactEmail: string
    contactWhatsAppVisible: boolean; contactTelegramVisible: boolean; contactEmailVisible: boolean
    contactTitle: { en: string; fr: string }; contactSubtitle: { en: string; fr: string }
    faqTitle: { en: string; fr: string }; faqSubtitle: { en: string; fr: string }
    termsTitle: { en: string; fr: string }; privacyTitle: { en: string; fr: string }
    dashboardTitle: { en: string; fr: string }; dashboardDesc: { en: string; fr: string }
    noProductsTitle: { en: string; fr: string }; noProductsDesc: { en: string; fr: string }
    notFoundTitle: { en: string; fr: string }; notFoundDesc: { en: string; fr: string }
    searchTitle: { en: string; fr: string }; searchNoResults: { en: string; fr: string }
  }
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const d = {
    siteName: 'Zizou Store', brandTagline: 'Premium Store', brandTaglineVisible: true, siteIcon: null, defaultLang: 'en' as Lang,
    heroTitle: { en: 'Premium Digital Subscriptions', fr: 'Abonnements Digitaux Premium' },
    heroSubtitle: { en: 'Subscriptions, IPTV, software licenses, game cards and gift cards — all in one store.', fr: 'Abonnements, IPTV, licences logicielles, cartes de jeu et cartes cadeaux — tout dans un seul magasin.' },
    heroBadge: 'Digital Store', heroBadgeVisible: true, heroVisible: true,
    homeSectionNew: { en: 'New Arrivals', fr: 'Nouveautés' }, homeSectionTrending: { en: 'Trending Now', fr: 'Populaires' }, homeSectionFeatured: { en: 'Featured', fr: 'Mis en avant' }, homeSectionCategories: { en: 'Categories', fr: 'Catégories' },
    homeFeaturedCount: 8, homeTrendingCount: 8,
    contactWhatsApp: '', contactTelegram: '', contactEmail: '',
    contactWhatsAppVisible: false, contactTelegramVisible: false, contactEmailVisible: false,
    contactTitle: { en: 'Need help?', fr: 'Besoin daide ?' }, contactSubtitle: { en: 'Message us on any platform — we respond fast, no account needed.', fr: 'Écrivez-nous sur nimporte quelle plateforme — réponse rapide, aucun compte requis.' },
    faqTitle: { en: 'Frequently Asked Questions', fr: 'Foire Aux Questions' }, faqSubtitle: { en: "Find answers to the most common questions about our store and products.", fr: "Trouvez les réponses aux questions les plus fréquentes sur notre magasin et nos produits." },
    termsTitle: { en: 'Terms of Service', fr: "Conditions d'Utilisation" }, privacyTitle: { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
    dashboardTitle: { en: 'Dashboard', fr: 'Tableau de Bord' }, dashboardDesc: { en: 'Overview of your store performance.', fr: "Vue densemble des performances de votre magasin." },
    noProductsTitle: { en: 'No Products Yet', fr: "Pas encore de produits" }, noProductsDesc: { en: 'Check back soon — new products are added regularly.', fr: "Revenez bientôt — de nouveaux produits sont ajoutés régulièrement." },
    notFoundTitle: { en: 'Product Not Found', fr: 'Produit Introuvable' }, notFoundDesc: { en: "This product may have been removed or the link is invalid.", fr: "Ce produit a peut-être été supprimé ou le lien est invalide." },
    searchTitle: { en: 'Search Results', fr: 'Résultats de Recherche' }, searchNoResults: { en: 'No results found.', fr: "Aucun résultat trouvé." },
    ...initial,
  }
  const [name, setName] = useState(d.siteName)
  const [tagline, setTagline] = useState(d.brandTagline)
  const [taglineVisible, setTaglineVisible] = useState(d.brandTaglineVisible)
  const [icon, setIcon] = useState(d.siteIcon || '')
  const [defaultLang, setDefaultLang] = useState(d.defaultLang)
  // Hero
  const [heroTitle, setHeroTitle] = useState(d.heroTitle)
  const [heroSubtitle, setHeroSubtitle] = useState(d.heroSubtitle)
  const [heroBadge, setHeroBadge] = useState(d.heroBadge)
  const [heroBadgeVisible, setHeroBadgeVisible] = useState(d.heroBadgeVisible)
  const [heroVisible, setHeroVisible] = useState(d.heroVisible)
  // Home sections
  const [homeSectionNew, setHomeSectionNew] = useState(d.homeSectionNew)
  const [homeSectionTrending, setHomeSectionTrending] = useState(d.homeSectionTrending)
  const [homeSectionFeatured, setHomeSectionFeatured] = useState(d.homeSectionFeatured)
  const [homeSectionCategories, setHomeSectionCategories] = useState(d.homeSectionCategories)
  const [homeFeaturedCount, setHomeFeaturedCount] = useState(d.homeFeaturedCount)
  const [homeTrendingCount, setHomeTrendingCount] = useState(d.homeTrendingCount)
  // Contact
  const [contactWhatsApp, setContactWhatsApp] = useState(d.contactWhatsApp)
  const [contactTelegram, setContactTelegram] = useState(d.contactTelegram)
  const [contactEmail, setContactEmail] = useState(d.contactEmail)
  const [contactWhatsAppVisible, setContactWhatsAppVisible] = useState(d.contactWhatsAppVisible)
  const [contactTelegramVisible, setContactTelegramVisible] = useState(d.contactTelegramVisible)
  const [contactEmailVisible, setContactEmailVisible] = useState(d.contactEmailVisible)
  const [contactTitle, setContactTitle] = useState(d.contactTitle)
  const [contactSubtitle, setContactSubtitle] = useState(d.contactSubtitle)
  // FAQ
  const [faqTitle, setFaqTitle] = useState(d.faqTitle)
  const [faqSubtitle, setFaqSubtitle] = useState(d.faqSubtitle)
  // Legal
  const [termsTitle, setTermsTitle] = useState(d.termsTitle)
  const [privacyTitle, setPrivacyTitle] = useState(d.privacyTitle)
  // Dashboard
  const [dashboardTitle, setDashboardTitle] = useState(d.dashboardTitle)
  const [dashboardDesc, setDashboardDesc] = useState(d.dashboardDesc)
  // 404 / no-products / search
  const [noProductsTitle, setNoProductsTitle] = useState(d.noProductsTitle)
  const [noProductsDesc, setNoProductsDesc] = useState(d.noProductsDesc)
  const [notFoundTitle, setNotFoundTitle] = useState(d.notFoundTitle)
  const [notFoundDesc, setNotFoundDesc] = useState(d.notFoundDesc)
  const [searchTitle, setSearchTitle] = useState(d.searchTitle)
  const [searchNoResults, setSearchNoResults] = useState(d.searchNoResults)

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const body = {
        siteName: name, brandTagline: tagline, brandTaglineVisible: taglineVisible, siteIcon: icon || null, defaultLang,
        heroTitle, heroSubtitle, heroBadge, heroBadgeVisible, heroVisible,
        homeSectionNew, homeSectionTrending, homeSectionFeatured, homeSectionCategories,
        homeFeaturedCount, homeTrendingCount,
        contactWhatsApp, contactTelegram, contactEmail,
        contactWhatsAppVisible, contactTelegramVisible, contactEmailVisible,
        contactTitle, contactSubtitle, faqTitle, faqSubtitle, termsTitle, privacyTitle,
        dashboardTitle, dashboardDesc, noProductsTitle, noProductsDesc, notFoundTitle, notFoundDesc, searchTitle, searchNoResults,
      }
      const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('save_failed')
      setSaved(true)
    } catch { setError('Failed to save') }
    setSaving(false)
  }

  const bilingual = (label: string, enVal: string, frVal: string, setEn: (v: string) => void, setFr: (v: string) => void) => (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs text-zinc-500 block mb-1">{label} — EN</label>
        <input value={enVal} onChange={e => setEn(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#22d3ee]/50" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500 block mb-1">{label} — FR</label>
        <input value={frVal} onChange={e => setFr(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#22d3ee]/50" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
        <div className="flex items-center gap-2 mb-3"><Globe className="h-4 w-4 text-[#22d3ee]" /> <h3 className="font-semibold text-white text-sm">{t(defaultLang, 'settings.lang')}</h3></div>
        <select value={defaultLang} onChange={e => setDefaultLang(e.target.value as Lang)} className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none">
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
        </select>
      </div>

      {/* Brand */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm">Brand</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500">Site name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
          <div><label className="text-xs text-zinc-500">Tagline</label><input value={tagline} onChange={e => setTagline(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={taglineVisible} onChange={e => setTaglineVisible(e.target.checked)} className="accent-[#f5c451]" /> Show tagline under name</label>
        <div><label className="text-xs text-zinc-500">Site icon URL</label><input value={icon} onChange={e => setIcon(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm">Hero</h3>
        {bilingual('Title', heroTitle.en, heroTitle.fr, setHeroTitle, setHeroTitle)}
        {bilingual('Subtitle', heroSubtitle.en, heroSubtitle.fr, setHeroSubtitle, setHeroSubtitle)}
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500">Badge</label><input value={heroBadge} onChange={e => setHeroBadge(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={heroBadgeVisible} onChange={e => setHeroBadgeVisible(e.target.checked)} className="accent-[#f5c451]" /> Show badge</label>
        <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={heroVisible} onChange={e => setHeroVisible(e.target.checked)} className="accent-[#f5c451]" /> Show hero section</label>
      </div>

      {/* Home sections */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm">Home sections</h3>
        {bilingual('New Arrivals', homeSectionNew.en, homeSectionNew.fr, setHomeSectionNew, setHomeSectionNew)}
        {bilingual('Trending', homeSectionTrending.en, homeSectionTrending.fr, setHomeSectionTrending, setHomeSectionTrending)}
        {bilingual('Featured', homeSectionFeatured.en, homeSectionFeatured.fr, setHomeSectionFeatured, setHomeSectionFeatured)}
        {bilingual('Categories', homeSectionCategories.en, homeSectionCategories.fr, setHomeSectionCategories, setHomeSectionCategories)}
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500">Featured count</label><input type="number" value={homeFeaturedCount} onChange={e => setHomeFeaturedCount(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
          <div><label className="text-xs text-zinc-500">Trending count</label><input type="number" value={homeTrendingCount} onChange={e => setHomeTrendingCount(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
        <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#22d3ee]" /> <h3 className="font-semibold text-white text-sm">Contact</h3></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-zinc-500">WhatsApp URL</label><input value={contactWhatsApp} onChange={e => setContactWhatsApp(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
          <div><label className="text-xs text-zinc-500">Telegram URL</label><input value={contactTelegram} onChange={e => setContactTelegram(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
        </div>
        <div><label className="text-xs text-zinc-500">Email</label><input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none" /></div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={contactWhatsAppVisible} onChange={e => setContactWhatsAppVisible(e.target.checked)} className="accent-[#22d3ee]" /> WhatsApp</label>
          <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={contactTelegramVisible} onChange={e => setContactTelegramVisible(e.target.checked)} className="accent-[#22d3ee]" /> Telegram</label>
          <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={contactEmailVisible} onChange={e => setContactEmailVisible(e.target.checked)} className="accent-[#22d3ee]" /> Email</label>
        </div>
        {bilingual('Title', contactTitle.en, contactTitle.fr, setContactTitle, setContactTitle)}
        {bilingual('Subtitle', contactSubtitle.en, contactSubtitle.fr, setContactSubtitle, setContactSubtitle)}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
        <h3 className="font-semibold text-white text-sm mb-3">FAQ</h3>
        {bilingual('Title', faqTitle.en, faqTitle.fr, setFaqTitle, setFaqTitle)}
        {bilingual('Subtitle', faqSubtitle.en, faqSubtitle.fr, setFaqSubtitle, setFaqSubtitle)}
      </div>

      {/* Legal */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm">Legal pages</h3>
        {bilingual('Terms title', termsTitle.en, termsTitle.fr, setTermsTitle, setTermsTitle)}
        {bilingual('Privacy title', privacyTitle.en, privacyTitle.fr, setPrivacyTitle, setPrivacyTitle)}
      </div>

      {/* Dashboard / 404 / search */}
      <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm">Dashboard & misc</h3>
        {bilingual('Dashboard title', dashboardTitle.en, dashboardTitle.fr, setDashboardTitle, setDashboardDesc)}
        {bilingual('Dashboard desc', dashboardDesc.en, dashboardDesc.fr, setDashboardDesc, setDashboardDesc)}
        {bilingual('No products title', noProductsTitle.en, noProductsTitle.fr, setNoProductsTitle, setNoProductsTitle)}
        {bilingual('No products desc', noProductsDesc.en, noProductsDesc.fr, setNoProductsDesc, setNoProductsDesc)}
        {bilingual('Not found title', notFoundTitle.en, notFoundTitle.fr, setNotFoundTitle, setNotFoundDesc)}
        {bilingual('Search title', searchTitle.en, searchTitle.fr, setSearchTitle, setSearchNoResults)}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> Save Settings</>}</Button>
        {saved && <span className="text-sm text-emerald-400">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  )
}