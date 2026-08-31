'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Input, Label, Textarea, Select, Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/ui'
import { Plus, Upload, Image, Trash2, Loader2, X, Tag, Key, Clock } from 'lucide-react'

interface Cat { id: string; name: string; slug: string }

export default function NewProductPage() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Cat[]>([])

  const [form, setForm] = useState({
    name: '', price: '', compare_at_price: '', stock: '10',
    status: 'active', product_type: 'subscription', delivery_type: 'automatic',
    description: '', short_description: '', sku: '', category_id: '',
    is_featured: false, is_popular: false, instructions: '',
  })

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [hasVariants, setHasVariants] = useState(true)
  const [durations, setDurations] = useState<{ id: string; name: string; duration_days: string; price: string; stock: string }[]>([
    { id: Math.random().toString(36).slice(2,8), name: '1 Month', duration_days: '30', price: '', stock: '10' }
  ])
  const [inventory, setInventory] = useState<{ id: string; email: string; password: string; code: string; notes: string; variant_index: string }[]>([])

  const isAutomatic = form.delivery_type === 'automatic'

  // auto-sync product_type -> hasVariants default
  useEffect(()=>{
    const multi = ['subscription','iptv','gift_card'].includes(form.product_type)
    // only auto-set on first load / when user changes type and hasn't manually toggled? keep simple: sync if durations empty
    if (durations.length===0 && multi) setHasVariants(true)
  },[form.product_type])

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d) }).catch(() => {})
  }, [])

  function addDuration() {
    setDurations(p => [...p, { id: Math.random().toString(36).slice(2, 8), name: '', duration_days: '30', price: '', stock: '10' }])
  }
  function addKey() {
    setInventory(p => [...p, { id: Math.random().toString(36).slice(2, 8), email: '', password: '', code: '', notes: '', variant_index: '' }])
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMsg('❌ Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('❌ Image too large (max 5MB)'); return }
    setUploading(true); setMsg(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'products')
    try {
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setImageUrl(data.url)
      setMsg('✅ Image uploaded')
    } catch (err) {
      setMsg('❌ Upload failed: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally { setUploading(false) }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const variantsFiltered = hasVariants ? durations.filter(d => d.name || d.price) : []
    if (!form.name) { setMsg('❌ Name is required'); return }
    if (hasVariants) {
      if (variantsFiltered.length===0) { setMsg('❌ Add at least one duration / option with name and price'); return }
      if (variantsFiltered.some(d=> !d.price || Number(d.price)<=0)) { setMsg('❌ Each duration needs a valid price'); return }
    } else {
      if (!form.price || Number(form.price)<=0) { setMsg('❌ Base price is required for single-price product'); return }
    }
    setLoading(true); setMsg(null)
    // For multi-variant products, base price/stock are 0 — price/stock live on variants only (product page hides base when variants exist)
    // For automatic delivery, stock is managed via inventory_items (available count) — so force stock 0 regardless
    const body = {
      ...form,
      price: hasVariants ? 0 : Number(form.price),
      compare_at_price: hasVariants ? null : (form.compare_at_price ? Number(form.compare_at_price) : null),
      stock: isAutomatic ? 0 : (hasVariants ? 0 : Number(form.stock || 0)),
      image_url: imageUrl,
      category_id: form.category_id || null,
      variants: variantsFiltered.map(d => ({
        name: d.name || `${d.duration_days} days`,
        duration_days: d.duration_days ? Number(d.duration_days) : null,
        price: Number(d.price),
        stock: isAutomatic ? 0 : Number(d.stock || 0),
      })),
      inventory: inventory.filter(i => i.email || i.password || i.code).map(i => ({
        email: i.email || undefined,
        password: i.password || undefined,
        code: i.code || undefined,
        notes: i.notes || undefined,
        variant_index: i.variant_index === '' ? undefined : Number(i.variant_index),
      })),
    }
    try {
      const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create product')
      setMsg(`✅ Product "${data.data.name}" created — slug: ${data.data.slug}`)
      setForm({ name: '', price: '', compare_at_price: '', stock: '10', status: 'active', product_type: 'subscription', delivery_type: 'automatic', description: '', short_description: '', sku: '', category_id: '', is_featured: false, is_popular: false, instructions: '' })
      setImageUrl(null); setDurations([]); setInventory([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setMsg('❌ ' + (err instanceof Error ? err.message : 'Something went wrong'))
    } finally { setLoading(false) }
  }

  const inputCls = 'mt-1.5'
  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">New Product</h1>
      {msg && (
        <div className={`rounded-xl p-3 border text-sm ${msg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-zinc-700">
          <CardHeader><CardTitle>Product Info</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Variant toggle */}
            <div className="rounded-xl border border-violet-600/20 bg-violet-600/5 p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Multiple durations / options? <span className="text-xs text-zinc-500">(Netflix 1/3/12 Months • Steam $10/$20/$50)</span></div>
                <div className="text-xs text-zinc-500">{hasVariants ? 'Each duration has its own price & stock — base price/stock auto-calculated' : 'Single price product — base price & stock used'}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={hasVariants} onChange={e=>setHasVariants(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Netflix Premium" required className={inputCls} /></div>
              {!hasVariants && (
                <>
                  <div><Label>Base Price (DZD) *</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required className={inputCls} /></div>
                  {!isAutomatic ? (
                    <div><Label>Base Stock</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inputCls} /></div>
                  ) : (
                    <div className="text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-xl p-3 flex items-center gap-2"><Key className="h-4 w-4"/> Stock from Inventory — no manual stock needed (automatic delivery)</div>
                  )}
                </>
              )}
              {!hasVariants && !isAutomatic && <div><Label>Compare at Price</Label><Input type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value }))} className={inputCls} /></div>}
              {hasVariants && (
                <div className={`text-xs rounded-xl p-3 flex items-center gap-2 border ${isAutomatic ? 'text-emerald-400 bg-emerald-600/10 border-emerald-600/20' : 'text-violet-400 bg-violet-600/10 border-violet-600/20'}`}>
                  {isAutomatic ? <Key className="h-4 w-4"/> : <Clock className="h-4 w-4"/>}
                  {isAutomatic ? 'Price from durations below — stock is counted from Inventory per duration (add keys below or in Inventory page)' : 'Price & stock come from durations below — no base price needed'}
                </div>
              )}
              <div><Label>Category</Label>
                <Select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className={inputCls}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  <option value="active">Active</option><option value="draft">Draft</option><option value="hidden">Hidden</option>
                </Select>
              </div>
              <div><Label>Product Type</Label>
                <Select value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))} className={inputCls}>
                  <option value="subscription">Subscription</option><option value="iptv">IPTV</option><option value="digital_key">Digital Key</option><option value="digital_account">Digital Account</option><option value="gift_card">Gift Card</option><option value="manual_delivery">Manual Delivery</option>
                </Select>
              </div>
              <div><Label>Delivery</Label>
                <Select value={form.delivery_type} onChange={e => setForm(f => ({ ...f, delivery_type: e.target.value }))} className={inputCls}>
                  <option value="automatic">Automatic (from stock keys)</option><option value="manual">Manual (admin fulfills order)</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <Label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500" /> Featured</Label>
              <Label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500" /> Popular</Label>
            </div>
            <div><Label>Short Description</Label><Textarea value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} rows={2} className={inputCls} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className={inputCls} /></div>
            <div><Label>Delivery Instructions (shown to buyer)</Label><Textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={2} placeholder="e.g. Do not change the password..." className={inputCls} /></div>
            <div className="pt-2 border-t border-zinc-800">
              <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> Product Image</Label>
              <div className="mt-2 space-y-2">
                {imageUrl && (
                  <div className="flex items-center gap-3">
                    <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-zinc-700" />
                    <Button type="button" variant="outline" size="sm" onClick={() => setImageUrl(null)}><X className="h-3 w-3" /> Remove</Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4" /> Choose Image</Button>
                  <span className="text-xs text-zinc-500">PNG/JPEG/WebP, max 5MB</span>
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-zinc-700 ${!hasVariants ? 'opacity-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Durations / Options {hasVariants && <span className="text-xs text-violet-400 font-normal">— each with its own price & stock</span>}</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addDuration} disabled={!hasVariants}><Plus className="h-4 w-4 mr-1" /> Add Duration</Button>
          </CardHeader>
          {!hasVariants ? (
            <CardContent className="p-6"><p className="text-sm text-zinc-500 text-center py-4">Single-price mode — toggle above to enable multiple durations/options (e.g., for Netflix or Steam cards).</p></CardContent>
          ) : (
          <CardContent className="p-6 space-y-3">
            {durations.length === 0 && <p className="text-sm text-zinc-500">Add the durations the customer can choose: e.g. 1 Month (30 days), 3 Months (90 days), 12 Months (365 days) — each with its own price and stock.</p>}
            {durations.map((d, i) => (
              <div key={d.id} className={`grid gap-2 items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 ${isAutomatic ? 'grid-cols-[1fr_100px_110px_36px]' : 'grid-cols-[1fr_100px_110px_90px_36px]'}`}>
                <Input placeholder="Name (e.g. 1 Month)" value={d.name} onChange={e => { const n = [...durations]; n[i].name = e.target.value; setDurations(n) }} className="h-9" />
                <Input type="number" placeholder="Days" title="Duration in days" value={d.duration_days} onChange={e => { const n = [...durations]; n[i].duration_days = e.target.value; setDurations(n) }} className="h-9" />
                <Input type="number" step="0.01" placeholder="Price DZD" value={d.price} onChange={e => { const n = [...durations]; n[i].price = e.target.value; setDurations(n) }} className="h-9" />
                {!isAutomatic ? (
                  <Input type="number" placeholder="Stock" value={d.stock} onChange={e => { const n = [...durations]; n[i].stock = e.target.value; setDurations(n) }} className="h-9" />
                ) : (
                  <div className="h-9 flex items-center justify-center text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-md px-2">Auto</div>
                )}
                <Button type="button" variant="ghost" size="icon" onClick={() => setDurations(p => p.filter(x => x.id !== d.id))} className="text-red-400 h-9 w-9"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
          )}
        </Card>

        <Card className="border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Inventory — Keys / Accounts to Deliver</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addKey}><Plus className="h-4 w-4 mr-1" /> Add Key</Button>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {inventory.length === 0 && <p className="text-sm text-zinc-500">Add the real keys/accounts. Each row = 1 unit sold. For automatic delivery these are delivered instantly. You can also leave this empty and fulfill orders manually later.</p>}
            {inventory.map((item, i) => (
              <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <Input placeholder="Email / Username" value={item.email} onChange={e => { const n = [...inventory]; n[i].email = e.target.value; setInventory(n) }} className="h-9" />
                  <Input placeholder="Password / Key" value={item.password} onChange={e => { const n = [...inventory]; n[i].password = e.target.value; setInventory(n) }} className="h-9" />
                  <Input placeholder="Code (gift cards)" value={item.code} onChange={e => { const n = [...inventory]; n[i].code = e.target.value; setInventory(n) }} className="h-9" />
                  <Input placeholder="Notes" value={item.notes} onChange={e => { const n = [...inventory]; n[i].notes = e.target.value; setInventory(n) }} className="h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={item.variant_index} onChange={e => { const n = [...inventory]; n[i].variant_index = e.target.value; setInventory(n) }} className="h-8 w-56 text-xs">
                    <option value="">Any duration (base product)</option>
                    {durations.map((d, di) => <option key={d.id} value={String(di)}>{d.name || `Duration #${di + 1}`}</option>)}
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setInventory(p => p.filter(x => x.id !== item.id))} className="text-red-400 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                  <span className="text-xs text-zinc-500">Key #{i + 1}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full h-12">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Product'}
        </Button>
      </form>
    </div>
  )
}