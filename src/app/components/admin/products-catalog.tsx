'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Badge, Card, CardContent } from '@/app/components/ui/ui'
import { Package, Tag, Loader2, Plus, Pencil, Trash2, Eye, MessageCircle } from 'lucide-react'
import { CategoryManager } from './category-manager'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  status: string
  image_url: string | null
  is_featured: boolean
  is_popular: boolean
  variants: { name: string; price: number; duration_days: number | null }[]
  contact_channels: string[]
  category: { id: string; name: string; slug: string } | null
}

interface Category { id: string; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number }

export function ProductsCatalog({ initialTab = 'products' }: { initialTab?: 'products' | 'categories' }) {
  const [tab, setTab] = useState<'products' | 'categories'>(initialTab)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()),
    ]).then(([prods, cats]) => {
      if (Array.isArray(prods)) setProducts(prods); else setError(prods?.error || 'Failed to load products')
      if (Array.isArray(cats)) setCategories(cats)
    }).catch(() => setError('Network error')).finally(() => setLoading(false))
  }, [])

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) setProducts(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setTab('products')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${tab === 'products' ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          <Package className="h-4 w-4" /> Products {products.length > 0 && <span className="text-xs bg-zinc-800 rounded-full px-2 py-0.5">{products.length}</span>}
        </button>
        <button onClick={() => setTab('categories')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${tab === 'categories' ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          <Tag className="h-4 w-4" /> Categories {categories.length > 0 && <span className="text-xs bg-zinc-800 rounded-full px-2 py-0.5">{categories.length}</span>}
        </button>
      </div>

      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">{products.length} product{products.length === 1 ? '' : 's'}</p>
            <Link href="/admin/products/new"><Button><Plus className="h-4 w-4 mr-1" /> New Product</Button></Link>
          </div>
          {error && <div className="rounded-xl p-3 border text-sm bg-red-500/10 border-red-500/20 text-red-400">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>
          ) : (
            <Card className="border-zinc-700">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-zinc-300">Image</th>
                      <th className="text-left font-medium text-zinc-300">Name</th>
                      <th className="text-left font-medium text-zinc-300">Category</th>
                      <th className="text-left font-medium text-zinc-300">Periods / Prices</th>
                      <th className="text-center font-medium text-zinc-300">Status</th>
                      <th className="text-right p-3 font-medium text-zinc-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {products.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No products yet. Click &quot;New Product&quot; to add one.</td></tr>
                    )}
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-900/30">
                        <td className="p-3">
                          {p.image_url
                            ? <img src={p.image_url} alt="" className="h-12 w-12 object-cover rounded-lg border border-zinc-700" />
                            : <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700"><Package className="h-5 w-5 text-zinc-500" /></div>}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-[11px] text-zinc-600">/products/{p.slug}</div>
                        </td>
                        <td className="p-3 text-zinc-400">{p.category?.name || '—'}</td>
                        <td className="p-3">
                          {p.variants?.length ? (
                            <div className="space-y-0.5">
                              {p.variants.map((v, i) => (
                                <div key={i} className="text-xs text-zinc-300">{v.name} — <span className="text-violet-300 font-medium">{Number(v.price).toLocaleString('en-US')}</span></div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-300">{Number(p.price).toLocaleString('en-US')}</span>
                          )}
                          <div className="text-[11px] text-zinc-600 mt-1 flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {p.contact_channels?.length ? `${p.contact_channels.length} channel${p.contact_channels.length===1?'':'s'}` : 'all channels'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={p.status === 'active' ? 'success' : 'warning'} className={p.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                            {p.status === 'active' ? 'Active' : 'Hidden'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/products/${p.slug}`} target="_blank"><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" title="View"><Eye className="h-4 w-4" /></Button></Link>
                            <Link href={`/admin/products/${p.id}`}><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-emerald-400" title="Edit"><Pencil className="h-4 w-4" /></Button></Link>
                            <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)} className="text-zinc-400 hover:text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'categories' && <CategoryManager />}
    </div>
  )
}
