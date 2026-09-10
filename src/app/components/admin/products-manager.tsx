'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Badge, Card, CardContent, Input, Label, Select, Textarea } from '@/app/components/ui/ui'
import { Package, Loader2, Plus, Pencil, Trash2, Eye, MessageCircle, X, Upload } from 'lucide-react'
import { apiGet, apiSend } from './api'

interface Cat { id: string; name: string; slug: string }
interface Channel { id: string; label: string; type: string; value: string; color: string }
interface Duration { key: string; id?: string; name: string; duration_days: string; price: string; compare_at_price: string }

interface Product {
  id: string
  name: string
  slug: string
  price: number
  status: string
  image_url: string | null
  images?: string[]
  is_featured: boolean
  is_popular: boolean
  description?: string
  short_description?: string
  category_id?: string | null
  variants: { id?: string; name: string; price: number; duration_days: number | null; compare_at_price?: number | null }[]
  contact_channels: string[]
  category: { id: string; name: string; slug: string } | null
}

const EMPTY_FORM = {
  name: '',
  short_description: '',
  description: '',
  category_id: '',
  price: '',
  compare_at_price: '',
  status: 'active',
  is_featured: false,
  is_popular: false,
}

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Cat[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // inline add/edit form — same pattern as Categories
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [hasVariants, setHasVariants] = useState(true)
  const [durations, setDurations] = useState<Duration[]>([
    { key: Math.random().toString(36).slice(2, 8), name: '1 Month', duration_days: '30', price: '', compare_at_price: '' },
  ])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prods, cats, chans] = await Promise.all([
        apiGet<Product[]>('/api/admin/products'),
        apiGet<Cat[]>('/api/admin/categories'),
        apiGet<Channel[]>('/api/admin/contacts'),
      ])
      setProducts(prods)
      setCategories(cats)
      setChannels(chans)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setForm({ ...EMPTY_FORM })
    setImages([])
    setHasVariants(true)
    setDurations([{ key: Math.random().toString(36).slice(2, 8), name: '1 Month', duration_days: '30', price: '', compare_at_price: '' }])
    setSelectedChannels([])
    setEditing(null)
  }

  function openAdd() {
    resetForm()
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      short_description: p.short_description || '',
      description: p.description || '',
      category_id: p.category_id || '',
      price: p.variants?.length ? '' : String(p.price ?? ''),
      compare_at_price: '',
      status: p.status,
      is_featured: !!p.is_featured,
      is_popular: !!p.is_popular,
    })
    setImages(p.images?.length ? p.images : (p.image_url ? [p.image_url] : []))
    setHasVariants((p.variants?.length || 0) > 0)
    setDurations(
      p.variants?.length
        ? p.variants.map(v => ({ key: Math.random().toString(36).slice(2, 8), id: v.id, name: v.name, duration_days: v.duration_days ? String(v.duration_days) : '', price: String(v.price), compare_at_price: v.compare_at_price ? String(v.compare_at_price) : '' }))
        : [{ key: Math.random().toString(36).slice(2, 8), name: '1 Month', duration_days: '30', price: '', compare_at_price: '' }]
    )
    setSelectedChannels(p.contact_channels || [])
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    for (const f of files) {
      if (!f.type.startsWith('image/')) { setMsg({ type: 'error', text: 'Please select image files only' }); return }
      if (f.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: `${f.name} is too large (max 5MB)` }); return }
    }
    setUploading(true); setMsg(null)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'products')
        const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        uploaded.push(data.url)
      }
      setImages(prev => [...prev, ...uploaded])
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' })
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim()) { setMsg({ type: 'error', text: 'Name is required' }); return }
    const variantsFiltered = hasVariants ? durations.filter(d => d.name.trim() || d.price) : []
    if (hasVariants) {
      if (variantsFiltered.length === 0) { setMsg({ type: 'error', text: 'Add at least one period with a name and price' }); return }
      if (variantsFiltered.some(d => !d.price || Number(d.price) <= 0)) { setMsg({ type: 'error', text: 'Each period needs a valid price' }); return }
    } else if (!form.price || Number(form.price) <= 0) {
      setMsg({ type: 'error', text: 'Price is required' }); return
    }

    setSaving(true); setMsg(null)
    const body = {
      name: form.name,
      description: form.description,
      short_description: form.short_description,
      category_id: form.category_id || null,
      image_url: images[0] || null,
      images,
      status: form.status,
      is_featured: form.is_featured,
      is_popular: form.is_popular,
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      has_variants: hasVariants,
      variants: hasVariants
        ? variantsFiltered.map(d => ({ id: d.id, name: d.name || `${d.duration_days} days`, duration_days: d.duration_days ? Number(d.duration_days) : null, price: Number(d.price), compare_at_price: d.compare_at_price ? Number(d.compare_at_price) : null }))
        : [],
      price: hasVariants ? undefined : Number(form.price),
      contact_channels: selectedChannels,
    }
    try {
      if (editing) await apiSend(`/api/admin/products/${editing.id}`, 'PATCH', body)
      else await apiSend('/api/admin/products', 'POST', body)
      setMsg({ type: 'success', text: editing ? 'Product updated!' : 'Product created!' })
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try { await apiSend(`/api/admin/products/${id}`, 'DELETE'); setProducts(p => p.filter(x => x.id !== id)) }
    catch (err) { setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' }) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#22d3ee]" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{products.length} product{products.length === 1 ? '' : 's'}</p>
        {!showForm && <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>}
      </div>

      {msg && (
        <div className={`rounded-xl p-3 border text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>
      )}
      {error && <div className="rounded-xl p-3 border text-sm bg-red-500/10 border-red-500/20 text-red-400">{error}</div>}

      {showForm && (
        <div ref={formRef}>
        <Card className="border-[#f5c451]/40 bg-[#111]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">{editing ? 'Edit Product' : 'New Product'}</h3>
              <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); resetForm() }} className="text-zinc-400 hover:text-white"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Netflix Premium" required className="mt-1.5" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="mt-1.5">
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Short description (shown under the title)</Label>
                <Input value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Premium account, instant activation" className="mt-1.5" />
              </div>
              <div>
                <Label>Full description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Everything the buyer should know about this product…" className="mt-1.5" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Product images</Label>
                <div className="mt-2 space-y-2">
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {images.map((src, i) => (
                        <div key={i} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Image ${i + 1}`} className={`h-20 w-20 object-cover rounded-xl border ${i === 0 ? 'border-[#f5c451]' : 'border-white/10'}`} />
                          {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-[#f5c451] rounded px-1">cover</span>}
                          <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 text-zinc-400 hover:text-red-400"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={handleImageUpload} ref={fileInputRef} className="mt-0 max-w-xs" />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-[#22d3ee]" />}
                  </div>
                  <p className="text-[11px] text-zinc-600">Select multiple images at once (Ctrl+click). First image = cover shown on the homepage; all images become a slider on the product page.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <Label className="mb-0">Periods &amp; prices</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setHasVariants(v => !v)}>
                    {hasVariants ? 'Use single price instead' : 'Add multiple periods'}
                  </Button>
                </div>
                {hasVariants ? (
                  <div className="space-y-3">
                    {durations.map((d, i) => (
                      <div key={d.key} className="grid grid-cols-[1fr_80px_100px_100px_36px] gap-2 items-end">
                        <div>
                          {i === 0 && <Label className="text-[10px]">Period name</Label>}
                          <Input value={d.name} onChange={e => setDurations(p => p.map(x => x.key === d.key ? { ...x, name: e.target.value } : x))} placeholder="1 Month" />
                        </div>
                        <div>
                          {i === 0 && <Label className="text-[10px]">Days</Label>}
                          <Input type="number" value={d.duration_days} onChange={e => setDurations(p => p.map(x => x.key === d.key ? { ...x, duration_days: e.target.value } : x))} placeholder="30" />
                        </div>
                        <div>
                          {i === 0 && <Label className="text-[10px]">Price *</Label>}
                          <Input type="number" step="0.01" value={d.price} onChange={e => setDurations(p => p.map(x => x.key === d.key ? { ...x, price: e.target.value } : x))} placeholder="1200" />
                        </div>
                        <div>
                          {i === 0 && <Label className="text-[10px]">Old price</Label>}
                          <Input type="number" step="0.01" value={d.compare_at_price} onChange={e => setDurations(p => p.map(x => x.key === d.key ? { ...x, compare_at_price: e.target.value } : x))} placeholder="—" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setDurations(p => p.filter(x => x.key !== d.key))} disabled={durations.length === 1} className="text-zinc-500 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setDurations(p => [...p, { key: Math.random().toString(36).slice(2, 8), name: '', duration_days: '30', price: '', compare_at_price: '' }])}><Plus className="h-4 w-4 mr-1" /> Add period</Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Price *</Label>
                      <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1200" className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Old price (for discount badge)</Label>
                      <Input type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value }))} placeholder="—" className="mt-1.5" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10">
                <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#22d3ee]" /> Order channels for this product</Label>
                <p className="text-xs text-zinc-500 mt-1 mb-2">Buyers see buttons for the selected channels on this product&apos;s page. Manage channels in the <b className="text-zinc-400">Contact</b> section.</p>
                {channels.length === 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
                    No contact channels yet. Add WhatsApp / Telegram etc. in the <b>Contact</b> section first.
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {channels.map(c => {
                    const on = selectedChannels.includes(c.id)
                    return (
                      <button key={c.id} type="button" onClick={() => setSelectedChannels(p => p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id])}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${on ? 'border-[#f5c451] bg-[#f5c451]/15 text-white' : 'border-white/10 bg-[#111] text-zinc-400 hover:text-white'}`}>
                        {on ? '✓ ' : ''}{c.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="mt-1.5">
                    <option value="active">Active — visible in store</option>
                    <option value="hidden">Hidden — only via direct link</option>
                  </Select>
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="h-4 w-4 rounded border-white/15 bg-[#111] text-[#f5c451] focus:ring-[#22d3ee]" />
                    <span className="text-sm">Featured on home</span>
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} className="h-4 w-4 rounded border-white/15 bg-[#111] text-[#f5c451] focus:ring-[#22d3ee]" />
                    <span className="text-sm">Popular</span>
                  </Label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editing ? 'Save changes' : 'Create product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      )}

      <Card className="border-white/10">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 border-b border-white/5 bg-white/[0.03]">
              <tr>
                <th className="text-left p-3 font-medium text-zinc-300">Image</th>
                <th className="text-left font-medium text-zinc-300">Name</th>
                <th className="text-left font-medium text-zinc-300">Category</th>
                <th className="text-left font-medium text-zinc-300">Periods / Prices</th>
                <th className="text-center font-medium text-zinc-300">Status</th>
                <th className="text-right p-3 font-medium text-zinc-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No products yet. Click &quot;Add Product&quot; to create one.</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="p-3">
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="h-12 w-12 object-cover rounded-lg border border-white/10" />
                      : <div className="h-12 w-12 rounded-lg bg-[#161616] flex items-center justify-center border border-white/10"><Package className="h-5 w-5 text-zinc-500" /></div>}
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
                          <div key={i} className="text-xs text-zinc-300">{v.name} — <span className="text-[#22d3ee] font-medium">{Number(v.price).toLocaleString('en-US')}</span></div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-300">{Number(p.price).toLocaleString('en-US')}</span>
                    )}
                    <div className="text-[11px] text-zinc-600 mt-1 flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {p.contact_channels?.length ? `${p.contact_channels.length} channel${p.contact_channels.length === 1 ? '' : 's'}` : 'all channels'}
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
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="text-zinc-400 hover:text-emerald-400" title="Edit"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-zinc-400 hover:text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
