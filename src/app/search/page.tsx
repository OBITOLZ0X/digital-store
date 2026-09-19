import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { getStoreProducts, getSettings } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }){
  const p = await searchParams
  const q = (p.q || '').trim()
  const sort = p.sort as string | undefined
  const lang = await getLang()
  const [res, settings] = await Promise.all([
    q ? getStoreProducts({ search: q, sort, limit: 24 }) : Promise.resolve({ products: [], total: 0 }),
    getSettings(),
  ])
  const currency = settings.currency || 'DZD'
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white">{t(lang, 'search.title')} {q && <>{t(lang, 'search.for')} <span className="text-[#22d3ee]">&ldquo;{q}&rdquo;</span></>}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t(lang, 'search.results', { n: res.total })}</p>
        {!q && <div className="mt-8 rounded-2xl border border-white/5 bg-[#111] p-8 text-center text-zinc-500">{t(lang, 'search.type')}</div>}
        {q && <div className="mt-6"><LangContext.Provider value={lang}><ProductGrid products={res.products as never} currency={currency} /></LangContext.Provider></div>}
        {q && res.products.length===0 && <div className="mt-8 text-center text-zinc-500">{t(lang, 'search.noResults', { q })}</div>}
      </div>
      <Footer lang={lang} />
    </div>
  )
}
