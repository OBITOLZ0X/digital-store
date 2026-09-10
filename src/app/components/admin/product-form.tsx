'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Textarea, Select, Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/ui'
import { Plus, Trash2, Loader2, X, Clock, MessageCircle, Upload } from 'lucide-react'

interface Cat { id: string; name: string; slug: string }
interface Channel { id: string; label: string; type: string; value: string; color: string }
interface Duration { key: string; id?: string; name: string; duration_days: string; price: string; compare_at_price: string }

export interface ProductFormInitial {
  id?: string
  name: string
  description: string
  short_description: string
  tutorial_url?: string | null
  category_id: string
  image_url: string | null
  images?: string[]
  price: string
  compare_at_price: string
  status: string
  is_featured: boolean
  is_popular: boolean
  has_variants: boolean
  variants: { id?: string; name: string; duration_days: number | null; price: number; compare_at_price?: number | null }[]
  contact_channels: string[]
}

export function ProductForm({ mode, initial }: { mode: 'new' | 'edit'; initial?: ProductFormInitial }) {
  const router = useRouter()
  const isEdit = mode === 'edit'
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Cat[]>([])
  const [channels, setChannels] = useState<Channel[]>([])

  const [form, setForm] = useState({
    name: initial?.name || '',
    short_description: initial?.short_description || '',
    description: initial?.description || '',
    tutorial_url: (initial as any)?.tutorial_url || '',
    category_id: initial?.category_id || '',
    price: initial?.price ?? '',
    compare_at_price: initial?.compare_at_price ?? '',
    status: initial?.status || 'active',
    is_featured: initial?.is_featured ?? false,
    is_popular: initial?.is_popular ?? false,
  })
  const [images, setImages] = useState<string[]>(initial?.images || (initial?.image_url ? [initial.image_url] : []))
  const [hasVariants, setHasVariants] = useState<boolean>(initial?.has_variants ?? true)
  const [durations, setDurations] = useState<Duration[]>(
    initial?.variants?.length
      ? initial.variants.map(v => ({ key: Math.random().toString(36).slice(2, 8), id: v.id, name: v.name, duration_days: v.duration_days ? String(v.duration_days) : '', price: String(v.price), compare_at_price: v.compare_at_price ? String(v.compare_at_price) : '' }))
      : [{ key: Math.random().toString(36).slice(2, 8), name: '1 Month', duration_days: '30', price: '', compare_at_price: '' }]
  )
  const [selectedChannels, setSelectedChannels] = useState<string[]>(initial?.contact_channels || [])

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d) }).catch(() => {})
    fetch('/api/admin/contacts').then(r => r.json()).then(d => { if (Array.isArray(d)) setChannels(d) }).catch(() => {})
  }, [])

  function addDuration() {
    setDurations(p => [...p, { key: Math.random().toString(36).slice(2, 8), name: '', duration_days: '30', price: '', compare_at_price: '' }])
  }
  function toggleChannel(id: string) {
    setSelectedChannels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    for (const f of files) {
      if (!f.type.startsWith('image/')) { setMsg({ type: 'error', text: 'Please select image files only' }); return }
      if (f.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: `Image ${f.name} too large (max 5MB)` }); return }
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
      setMsg({ type: 'error', text: 'Upload failed: ' + (err instanceof Error ? err.message : 'unknown') })
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

    setLoading(true); setMsg(null)
    const body = {
      name: form.name,
      description: form.description,
      short_description: form.short_description,
      tutorial_url: form.tutorial_url || undefined,
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
      const res = await fetch(isEdit ? `/api/admin/products/${initial?.id}` : '/api/admin/products', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {msg && <div className={`rounded-xl p-3 border text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>}

      <Card className="border-white/10">
        <CardHeader><CardTitle>Product info</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-4">
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
            <Label>Tutorial video (YouTube link)</Label>
            <Input value={form.tutorial_url} onChange={e => setForm(f => ({ ...f, tutorial_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="mt-1.5" />
            <p className="text-[11px] text-zinc-600 mt-1">Only YouTube links are accepted. It appears as a video player under the slider on the product page. Leave empty for none.</p>
          </div>
          <div>
            <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Product image</Label>
            <div className="mt-2 flex items-center gap-3">
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt={`Image ${i + 1}`} className={`h-20 w-20 object-cover rounded-xl border ${i === 0 ? 'border-[#f5c451]' : 'border-white/10'}`} />
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-[#f5c451] rounded px-1">cover</span>}
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-[#161616] rounded-full p-1 text-zinc-400 hover:text-red-400"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={handleImageUpload} ref={fileInputRef} className="mt-0 max-w-xs" />
              <p className="text-[11px] text-zinc-600">First image = cover. All images become a slider on the product page.</p>
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-[#22d3ee]" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#22d3ee]" /> Periods &amp; prices</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Each period shows as a price row on the product landing page.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setHasVariants(v => !v)}>
              {hasVariants ? 'Use single price instead' : 'Add multiple periods'}
            </Button>
          </div>

          {hasVariants ? (
            <div className="space-y-3">
              {durations.map((d, i) => (
                <div key={d.key} className="grid grid-cols-[1fr_90px_110px_110px_36px] gap-2 items-end">
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
              <Button type="button" variant="outline" size="sm" onClick={addDuration}><Plus className="h-4 w-4 mr-1" /> Add period</Button>
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
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#22d3ee]" /> Order channels for this product</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-3">
          <p className="text-xs text-zinc-500">Buyers see buttons for the selected channels on this product&apos;s page. Manage the list in <b className="text-zinc-400">Contact</b>.</p>
          {channels.length === 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
              No contact channels yet. Add WhatsApp / Telegram etc. in the <b>Contact</b> section first.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {channels.map(c => {
              const on = selectedChannels.includes(c.id)
              return (
                <button key={c.id} type="button" onClick={() => toggleChannel(c.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${on ? 'border-[#f5c451] bg-[#f5c451] text-black/20 text-white' : 'border-white/5 bg-[#111] text-zinc-400 hover:text-white'}`}>
                  {on ? '✓ ' : ''}{c.label}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-zinc-600">If none selected, all channels are shown on the product page.</p>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="mt-1.5">
                <option value="active">Active — visible in store</option>
                <option value="hidden">Hidden — only via direct link</option>
              </Select>
            </div>
            <div className="flex items-center gap-6 pt-6">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="h-4 w-4 rounded border-white/15 bg-[#161616] text-[#f5c451] focus:ring-[#22d3ee]" />
                <span className="text-sm">Featured on home</span>
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} className="h-4 w-4 rounded border-white/15 bg-[#161616] text-[#f5c451] focus:ring-[#22d3ee]" />
                <span className="text-sm">Popular</span>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-8">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>Cancel</Button>
      </div>
    </form>
  )
}
