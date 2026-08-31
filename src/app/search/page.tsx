import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { ProductGrid } from '@/app/components/products/product-card'
import { getStoreProducts } from '@/lib/actions/products'



export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }){
  const p = await searchParams
  const q = p.q || ''
  const sort = p.sort as string | undefined
  let products: Record<string,unknown>[] = []
  let total = 0
  if (q) {
    try { const r = await getStoreProducts({ search: q, sort: sort as never, limit: 24 }); if(r.success){products=r.data.products; total=r.data.total} } catch {}
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white">Search {q && <>for <span className="text-violet-400">“{q}”</span></>}</h1>
        <p className="text-sm text-zinc-500 mt-1">{total} results</p>
        {!q && <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">Type something to search products.</div>}
        {q && <div className="mt-6"><ProductGrid products={products as never} /></div>}
        {q && products.length===0 && <div className="mt-8 text-center text-zinc-500">No results for “{q}”. Try different keywords.</div>}
      </div>
      <Footer />
    </div>
  )
}