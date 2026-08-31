'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Textarea, Select } from '@/app/components/ui/ui'
import { Loader2, Image as ImageIcon, Plus, Upload, X, Trash2, Clock, Key, Tag } from 'lucide-react'

interface Variant { id: string; name: string; price: number; stock: number; duration_days: number | null }
interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  status: string
  image_url: string | null
  category: { name: string } | null
  variants?: Variant[]
  delivery_type?: string
  inventory?: { variantStats: Record<string,{available:number,total:number}>, productAvailable:number, productTotal:number }
}
interface Cat { id: string; name: string; slug: string }

function ProductInlineForm({ onCreated, onCancel }: { onCreated: ()=>void, onCancel: ()=>void }) {
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

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d) }).catch(() => {})
  }, [])

  function addDuration() { setDurations(p => [...p, { id: Math.random().toString(36).slice(2, 8), name: '', duration_days: '30', price: '', stock: '10' }]) }
  function addKey() { setInventory(p => [...p, { id: Math.random().toString(36).slice(2, 8), email: '', password: '', code: '', notes: '', variant_index: '' }]) }

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
      setTimeout(()=>{ onCreated(); }, 600)
    } catch (err) {
      setMsg('❌ ' + (err instanceof Error ? err.message : 'Something went wrong'))
    } finally { setLoading(false) }
  }

  const inputCls = 'mt-1.5'
  return (
    <Card className="border-violet-600/30 bg-zinc-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">New Product</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="p-6">
        {msg && <div className={`mb-4 rounded-xl p-3 border text-sm ${msg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-violet-600/20 bg-violet-600/5 p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Multiple durations / options? <span className="text-xs text-zinc-500">(Netflix 1/3/12 Months • Steam $10/$20/$50)</span></div>
              <div className="text-xs text-zinc-500">{hasVariants ? 'Each duration has its own price & stock' : 'Single price product'}</div>
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
                  <div className="text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-xl p-3 flex items-center gap-2"><Key className="h-4 w-4"/> Stock from Inventory — no manual stock needed</div>
                )}
              </>
            )}
            {!hasVariants && !isAutomatic && <div><Label>Compare at Price</Label><Input type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value }))} className={inputCls} /></div>}
            {hasVariants && (
              <div className={`text-xs rounded-xl p-3 flex items-center gap-2 border ${isAutomatic ? 'text-emerald-400 bg-emerald-600/10 border-emerald-600/20' : 'text-violet-400 bg-violet-600/10 border-violet-600/20'}`}>
                {isAutomatic ? <Key className="h-4 w-4"/> : <Clock className="h-4 w-4"/>}
                {isAutomatic ? 'Price from durations — stock from Inventory per duration' : 'Price & stock from durations below'}
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
          <div><Label>Delivery Instructions</Label><Textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={2} placeholder="e.g. Do not change the password..." className={inputCls} /></div>

          <div className="pt-2 border-t border-zinc-800">
            <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Product Image</Label>
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

          <div className={`rounded-xl border p-4 ${!hasVariants ? 'opacity-50 border-zinc-700' : 'border-zinc-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-white flex items-center gap-2"><Clock className="h-4 w-4" /> Durations / Options {hasVariants && <span className="text-xs text-violet-400 font-normal">— each with its own price & stock</span>}</div>
              <Button type="button" variant="outline" size="sm" onClick={addDuration} disabled={!hasVariants}><Plus className="h-4 w-4 mr-1" /> Add Duration</Button>
            </div>
            {!hasVariants ? (
              <p className="text-sm text-zinc-500 text-center py-4">Single-price mode — toggle above to enable multiple durations.</p>
            ) : (
              <div className="space-y-3">
                {durations.length === 0 && <p className="text-sm text-zinc-500">Add durations: e.g. 1 Month (30 days), 3 Months (90 days).</p>}
                {durations.map((d, i) => (
                  <div key={d.id} className={`grid gap-2 items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 ${isAutomatic ? 'grid-cols-[1fr_100px_110px_36px]' : 'grid-cols-[1fr_100px_110px_90px_36px]'}`}>
                    <Input placeholder="Name (e.g. 1 Month)" value={d.name} onChange={e => { const n = [...durations]; n[i].name = e.target.value; setDurations(n) }} className="h-9" />
                    <Input type="number" placeholder="Days" value={d.duration_days} onChange={e => { const n = [...durations]; n[i].duration_days = e.target.value; setDurations(n) }} className="h-9" />
                    <Input type="number" step="0.01" placeholder="Price DZD" value={d.price} onChange={e => { const n = [...durations]; n[i].price = e.target.value; setDurations(n) }} className="h-9" />
                    {!isAutomatic ? (
                      <Input type="number" placeholder="Stock" value={d.stock} onChange={e => { const n = [...durations]; n[i].stock = e.target.value; setDurations(n) }} className="h-9" />
                    ) : (
                      <div className="h-9 flex items-center justify-center text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-md px-2">Auto</div>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={() => setDurations(p => p.filter(x => x.id !== d.id))} className="text-red-400 h-9 w-9"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-white flex items-center gap-2"><Key className="h-4 w-4" /> Inventory — Keys / Accounts</div>
              <Button type="button" variant="outline" size="sm" onClick={addKey}><Plus className="h-4 w-4 mr-1" /> Add Key</Button>
            </div>
            {inventory.length === 0 && <p className="text-sm text-zinc-500">Add the real keys/accounts. Each row = 1 unit sold. Leave empty to fulfill manually later.</p>}
            {inventory.map((item, i) => (
              <div key={item.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 space-y-2 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <Input placeholder="Email / Username" value={item.email} onChange={e => { const n = [...inventory]; n[i].email = e.target.value; setInventory(n) }} className="h-9" />
                  <Input placeholder="Password / Key" value={item.password} onChange={e => { const n = [...inventory]; n[i].password = e.target.value; setInventory(n) }} className="h-9" />
                  <Input placeholder="Code" value={item.code} onChange={e => { const n = [...inventory]; n[i].code = e.target.value; setInventory(n) }} className="h-9" />
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
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1 h-12">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Product'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="h-12">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function ProductsCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function fetchProducts() {
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      if (res.ok) {
        const list = Array.isArray(data) ? data : []
        setProducts(list.filter((p:any)=>p.status!=='archived'))
      }
      else setError(data.error || 'Failed to load products')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{products.length} product{products.length === 1 ? '' : 's'}</p>
        {!showForm && <Button onClick={()=>setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> New Product</Button>}
      </div>

      {showForm && (
        <ProductInlineForm
          onCreated={()=>{ setShowForm(false); setLoading(true); fetchProducts() }}
          onCancel={()=>setShowForm(false)}
        />
      )}

      {error && <div className="rounded-xl p-3 border text-sm bg-red-500/10 border-red-500/20 text-red-400">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>
      ) : (
        <Card className="border-zinc-700">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                <tr>
                  <th className="text-left p-3 font-medium text-zinc-300">Image</th>
                  <th className="text-left font-medium text-zinc-300">Name</th>
                  <th className="text-left font-medium text-zinc-300">Category</th>
                  <th className="text-right font-medium text-zinc-300">Price</th>
                  <th className="text-center font-medium text-zinc-300">Stock</th>
                  <th className="text-center font-medium text-zinc-300">Status</th>
                  <th className="text-right p-3 font-medium text-zinc-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map(p => {
                  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0
                  const minPrice = hasVariants ? Math.min(...p.variants!.map(v => Number(v.price))) : Number(p.price)
                  const totalStock = hasVariants ? p.variants!.reduce((s, v) => s + Number(v.stock || 0), 0) : Number(p.stock)
                  return (
                  <tr key={p.id} className="hover:bg-zinc-900/30">
                    <td className="p-3">
                      {p.image_url
                        ? <img src={p.image_url} alt="" className="h-14 w-14 object-cover rounded-lg border border-zinc-700" />
                        : <div className="h-14 w-14 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700"><ImageIcon className="h-6 w-6 text-zinc-500" /></div>}
                    </td>
                    <td className="p-3"><div className="font-medium text-white">{p.name}</div><div className="text-xs text-zinc-500">{p.slug}</div></td>
                    <td className="text-zinc-400">{p.category?.name || '—'}</td>
                    <td className="text-right">
                      {hasVariants ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-600/30">Multiple • {p.variants!.length} options</span>
                          <span className="font-mono text-white text-xs mt-1">From {minPrice.toFixed(2)} DZD</span>
                        </div>
                      ) : (
                        <span className="font-mono text-white">{Number(p.price).toFixed(2)} DZD</span>
                      )}
                    </td>
                    <td className="text-center">
                      {(p as any).delivery_type === 'automatic' ? (
                        hasVariants ? (
                          <div className="flex flex-col gap-1 items-center">
                            <span className="text-[10px] leading-none text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-full px-2 py-0.5">Auto • Inventory</span>
                            <div className="text-[11px] leading-tight space-y-0.5 mt-1 text-left">
                              {p.variants!.map(v=>{
                                const st = p.inventory?.variantStats?.[v.id]
                                const av = st?.available ?? 0
                                const tot = st?.total ?? 0
                                const out = av===0
                                return (
                                  <div key={v.id} className={`flex justify-between gap-2 px-2 py-0.5 rounded ${out ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-300'}`}>
                                    <span className="font-medium">{v.name}</span>
                                    <span className="font-mono">{av} available • {tot} total{out ? ' — out of stock' : ''}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-full px-2 py-0.5">Auto • Inventory</span>
                            <span className={`text-xs font-mono ${ (p.inventory?.productAvailable ?? 0)===0 ? 'text-red-400' : 'text-zinc-300'}`}>
                              {p.inventory?.productAvailable ?? 0} available • {p.inventory?.productTotal ?? 0} total{(p.inventory?.productAvailable ?? 0)===0 ? ' — out of stock' : ''}
                            </span>
                          </div>
                        )
                      ) : hasVariants ? (
                        <span className="text-xs text-zinc-400">{totalStock} <span className="text-[10px] text-zinc-600">across variants</span></span>
                      ) : p.stock}
                    </td>
                    <td className="text-center"><Badge variant={p.status === 'active' ? 'success' : 'secondary'}>{p.status}</Badge></td>
                    <td className="text-right p-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/products/${p.id}`} className="text-violet-400 hover:underline text-xs border border-violet-600/30 rounded px-2 py-1">Edit</Link>
                        <button onClick={async()=>{
                          if(!confirm(`Delete "${p.name}"?${(p as any).inventory?.productTotal ? `\nThis product has inventory (${(p as any).inventory.productTotal} items) and/or orders — it will be archived (hidden from store) and inventory will show as "deleted product" instead of being hard-deleted.` : ''}\nThis cannot be undone for hard deletes.`)) return;
                          const r=await fetch(`/api/admin/products/${p.id}`,{method:'DELETE'}); const j=await r.json();
                          if(!r.ok) alert(j.error||'Failed');
                          else {
                            setProducts(ps=>ps.filter(x=>x.id!==p.id))
                            if(j.soft) alert(j.message||'Product archived — hidden from catalog, inventory marked as deleted product.');
                          }
                        }} className="text-red-400 hover:text-red-300 text-xs border border-red-600/30 rounded px-2 py-1">Delete</button>
                      </div>
                    </td>
                  </tr>
                )})}
                {products.length === 0 && !showForm && (
                  <tr><td colSpan={7} className="p-8 text-center text-zinc-500">No products yet. Click "+ New Product" to create one.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
