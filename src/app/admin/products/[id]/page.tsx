'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Input, Label, Textarea, Select, Card, CardHeader, CardTitle, CardContent, Badge } from '@/app/components/ui/ui'
import { Plus, Upload, Trash2, Loader2, X, Clock, Key, ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type Cat = { id:string; name:string }
type Variant = { id?:string; name:string; duration_days:string; price:string; stock:string }

export default function EditProductPage(){
  const { id } = useParams<{id:string}>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Cat[]>([])
  const [form, setForm] = useState<any>({ name:'', price:'', compare_at_price:'', stock:'10', status:'active', product_type:'subscription', delivery_type:'automatic', description:'', short_description:'', sku:'', category_id:'', is_featured:false, is_popular:false, instructions:'' })
  const [imageUrl, setImageUrl] = useState<string|null>(null)
  const [durations, setDurations] = useState<Variant[]>([])
  const [hasVariants, setHasVariants] = useState(false)
  const [initialSlug, setInitialSlug] = useState('')
  const [inventory, setInventory] = useState<{id:string; variant_id:string|null; status:string}[]>([])
  const isAutomatic = form.delivery_type === 'automatic'

  useEffect(()=>{ fetch('/api/admin/categories').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setCategories(d)}).catch(()=>{}) },[])
  useEffect(()=>{
    async function load(){
      setLoading(true)
      try{
        const res = await fetch(`/api/admin/products/${id}`)
        const j = await res.json()
        if(!res.ok) throw new Error(j.error||'Not found')
        const p = j.product
        setForm({
          name: p.name||'', price: String(p.price||''), compare_at_price: p.compare_at_price? String(p.compare_at_price):'', stock: String(p.stock||0),
          status: p.status||'active', product_type: p.product_type||'digital_key', delivery_type: p.delivery_type||'automatic',
          description: p.description||'', short_description: p.short_description||'', sku: p.sku||'', category_id: p.category_id||'',
          is_featured: !!p.is_featured, is_popular: !!p.is_popular, instructions: p.instructions||''
        })
        setInitialSlug(p.slug)
        setImageUrl(p.images?.[0] || null)
        const vars = (j.variants||[]).map((v:any)=>({ id:v.id, name:v.name, duration_days: v.duration_days? String(v.duration_days):'', price: String(v.price), stock: String(v.stock)}))
        setDurations(vars)
        setHasVariants(vars.length>0)
        setInventory(j.inventory || [])
      }catch(e){ setMsg('❌ '+(e instanceof Error?e.message:'Failed')) } finally{ setLoading(false)}
    }
    load()
  },[id])

  function addDuration(){ setDurations(p=>[...p,{ name:'', duration_days:'30', price:'', stock:'10'}]) }

  async function handleUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]
    if(!file) return
    if(!file.type.startsWith('image/')){ setMsg('❌ Please select an image'); return }
    if(file.size>5*1024*1024){ setMsg('❌ Max 5MB'); return }
    setUploading(true); setMsg(null)
    const fd=new FormData(); fd.append('file',file); fd.append('folder','products')
    try{ const res=await fetch('/api/admin/upload-image',{method:'POST',body:fd}); const d=await res.json(); if(!res.ok) throw new Error(d.error); setImageUrl(d.url); setMsg('✅ Image uploaded — save to apply') } catch(err){ setMsg('❌ '+(err instanceof Error?err.message:'Upload failed')) } finally{ setUploading(false)}
  }

  async function handleSave(e:React.FormEvent){
    e.preventDefault()
    const filtered = hasVariants ? durations.filter(d=>d.name||d.price) : []
    if(!form.name){ setMsg('❌ Name required'); return }
    if(hasVariants){
      if(filtered.length===0){ setMsg('❌ Add at least one duration/option'); return }
      if(filtered.some(d=>!d.price || Number(d.price)<=0)){ setMsg('❌ Each duration needs price'); return }
    } else {
      if(!form.price || Number(form.price)<=0){ setMsg('❌ Base price required'); return }
    }
    setSaving(true); setMsg(null)
    // Variant products keep base price/stock at 0 — real price/stock is per-variant
    // For automatic delivery, stock is managed via inventory_items — force 0
    try{
      const body={
        ...form, price: hasVariants ? 0 : Number(form.price), compare_at_price: hasVariants ? null : (form.compare_at_price? Number(form.compare_at_price): null), stock: isAutomatic ? 0 : (hasVariants ? 0 : Number(form.stock||0)),
        image_url: imageUrl, category_id: form.category_id|| null,
        variants: filtered.map(d=>({ name:d.name||`${d.duration_days} days`, duration_days: d.duration_days? Number(d.duration_days): null, price: Number(d.price), stock: isAutomatic ? 0 : Number(d.stock||0)}))
      }
      const res=await fetch(`/api/admin/products/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      const j=await res.json()
      if(!res.ok) throw new Error(j.error||'Failed')
      setMsg('✅ Saved')
    }catch(err){ setMsg('❌ '+(err instanceof Error?err.message:'Failed')) } finally{ setSaving(false)}
  }

  async function handleDelete(){
    if(!confirm(`Delete "${form.name}"? This will also delete its variants & available inventory. Sold history (orders) stays. This cannot be undone.`)) return
    setDeleting(true)
    try{
      const res=await fetch(`/api/admin/products/${id}`,{method:'DELETE'})
      const j=await res.json()
      if(!res.ok) throw new Error(j.error)
      router.push('/admin/products')
    }catch(err){ setMsg('❌ '+(err instanceof Error?err.message:'Delete failed')); setDeleting(false)}
  }

  if(loading) return <div className="mx-auto max-w-4xl p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400"/></div>

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4"/> Back to products</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Edit Product <span className="text-violet-400 font-mono text-lg">{String(id).slice(0,8)}</span></h1>
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting? <Loader2 className="h-4 w-4 animate-spin"/>: <Trash2 className="h-4 w-4"/>} Delete</Button>
      </div>
      {initialSlug && <p className="text-xs text-zinc-500">Slug: <code className="bg-zinc-800 px-1 rounded">{initialSlug}</code> • URL: <a href={`/products/${initialSlug}`} className="text-violet-400 hover:underline">/products/{initialSlug}</a></p>}
      {msg && <div className={`rounded-xl p-3 border text-sm ${msg.startsWith('✅')?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-zinc-700">
          <CardHeader><CardTitle>Product Info</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="rounded-xl border border-violet-600/20 bg-violet-600/5 p-3 flex items-center justify-between">
              <div><div className="text-sm font-semibold text-white">Multiple durations / options? <span className="text-xs text-zinc-500">(Netflix 1/3/12 Months • Steam $10/$20/$50)</span></div><div className="text-xs text-zinc-500">{hasVariants ? 'Each duration has its own price & stock — base auto-calculated' : 'Single price product'}</div></div>
              <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={hasVariants} onChange={e=>setHasVariants(e.target.checked)} className="sr-only peer"/><div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div></label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} required className="mt-1.5"/></div>
              {!hasVariants && (
                <>
                  <div><Label>Base Price (DZD) *</Label><Input type="number" step="0.01" value={form.price} onChange={e=>setForm((f:any)=>({...f,price:e.target.value}))} required className="mt-1.5"/></div>
                  {!isAutomatic ? (
                    <div><Label>Base Stock</Label><Input type="number" value={form.stock} onChange={e=>setForm((f:any)=>({...f,stock:e.target.value}))} className="mt-1.5"/></div>
                  ) : (
                    <div className="text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-xl p-3 flex items-center gap-2"><Key className="h-4 w-4"/> Stock from Inventory — automatic delivery</div>
                  )}
                </>
              )}
              {!hasVariants && !isAutomatic && <div><Label>Compare at</Label><Input type="number" step="0.01" value={form.compare_at_price} onChange={e=>setForm((f:any)=>({...f,compare_at_price:e.target.value}))} className="mt-1.5"/></div>}
              {hasVariants && (
                <div className={`text-xs rounded-xl p-3 flex items-center gap-2 border ${isAutomatic ? 'text-emerald-400 bg-emerald-600/10 border-emerald-600/20' : 'text-violet-400 bg-violet-600/10 border-violet-600/20'}`}>
                  {isAutomatic ? <Key className="h-4 w-4"/> : <Clock className="h-4 w-4"/>}
                  {isAutomatic ? 'Price from durations below — stock is counted from Inventory per duration' : 'Price & stock come from durations below'}
                </div>
              )}
              <div><Label>Category</Label><Select value={form.category_id} onChange={e=>setForm((f:any)=>({...f,category_id:e.target.value}))} className="mt-1.5"><option value="">No category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
              <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} className="mt-1.5"><option value="active">Active</option><option value="draft">Draft</option><option value="hidden">Hidden</option><option value="archived">Archived</option></Select></div>
              <div><Label>Type</Label><Select value={form.product_type} onChange={e=>setForm((f:any)=>({...f,product_type:e.target.value}))} className="mt-1.5"><option value="subscription">Subscription</option><option value="iptv">IPTV</option><option value="digital_key">Digital Key</option><option value="digital_account">Digital Account</option><option value="gift_card">Gift Card</option><option value="manual_delivery">Manual Delivery</option></Select></div>
              <div><Label>Delivery</Label><Select value={form.delivery_type} onChange={e=>setForm((f:any)=>({...f,delivery_type:e.target.value}))} className="mt-1.5"><option value="automatic">Automatic</option><option value="manual">Manual (admin fulfills)</option></Select></div>
            </div>
            <div className="flex gap-6 text-sm">
              <Label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm((f:any)=>({...f,is_featured:e.target.checked}))} className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500"/> Featured</Label>
              <Label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_popular} onChange={e=>setForm((f:any)=>({...f,is_popular:e.target.checked}))} className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-violet-500"/> Popular</Label>
            </div>
            <div><Label>Short Description</Label><Textarea value={form.short_description} onChange={e=>setForm((f:any)=>({...f,short_description:e.target.value}))} rows={2} className="mt-1.5"/></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} rows={4} className="mt-1.5"/></div>
            <div><Label>Instructions</Label><Textarea value={form.instructions} onChange={e=>setForm((f:any)=>({...f,instructions:e.target.value}))} rows={2} className="mt-1.5"/></div>
            <div className="pt-2 border-t border-zinc-800">
              <Label>Product Image</Label>
              <div className="mt-2 space-y-2">
                {imageUrl && <div className="flex items-center gap-3"><img src={imageUrl} alt="" className="h-20 w-20 object-cover rounded-lg border border-zinc-700"/><Button type="button" variant="outline" size="sm" onClick={()=>setImageUrl(null)}><X className="h-3 w-3"/> Remove</Button></div>}
                <div className="flex items-center gap-2"><Button type="button" variant="outline" onClick={()=>fileRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4"/> Choose Image</Button>{uploading && <Loader2 className="h-4 w-4 animate-spin text-violet-400"/>}<span className="text-xs text-zinc-500">PNG/JPEG/WebP max 5MB</span></div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} className="hidden"/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4"/> Durations / Options {hasVariants && <span className="text-xs text-violet-400 font-normal">— each price & stock</span>}</CardTitle><Button type="button" variant="outline" size="sm" onClick={addDuration} disabled={!hasVariants}><Plus className="h-4 w-4 mr-1"/> Add</Button></CardHeader>
          {!hasVariants ? (
            <CardContent className="p-6"><p className="text-sm text-zinc-500 text-center py-4">Single-price mode — toggle above to enable durations.</p></CardContent>
          ) : (
          <CardContent className="p-6 space-y-3">
            {durations.length===0 && <p className="text-sm text-zinc-500">No durations — Add e.g. 1 Month (30 days), 3 Months (90) etc. Each needs its own price & stock.</p>}
            {durations.map((d,i)=>(
              <div key={i} className={`grid gap-2 items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 ${isAutomatic ? 'grid-cols-[1fr_100px_110px_36px]' : 'grid-cols-[1fr_100px_110px_90px_36px]'}`}>
                <Input placeholder="Name (e.g. 1 Month)" value={d.name} onChange={e=>{ const n=[...durations]; n[i].name=e.target.value; setDurations(n)}} className="h-9"/>
                <Input type="number" placeholder="Days" value={d.duration_days} onChange={e=>{ const n=[...durations]; n[i].duration_days=e.target.value; setDurations(n)}} className="h-9"/>
                <Input type="number" step="0.01" placeholder="Price" value={d.price} onChange={e=>{ const n=[...durations]; n[i].price=e.target.value; setDurations(n)}} className="h-9"/>
                {!isAutomatic ? (
                  <Input type="number" placeholder="Stock" value={d.stock} onChange={e=>{ const n=[...durations]; n[i].stock=e.target.value; setDurations(n)}} className="h-9"/>
                ) : (
                  <div className="h-9 flex items-center justify-center text-xs text-emerald-400 bg-emerald-600/10 border border-emerald-600/20 rounded-md px-2">Auto</div>
                )}
                <Button type="button" variant="ghost" size="icon" onClick={()=>setDurations(p=>p.filter((_,idx)=>idx!==i))} className="text-red-400 h-9 w-9"><Trash2 className="h-4 w-4"/></Button>
              </div>
            ))}
            <p className="text-xs text-amber-400/80 flex gap-1"><AlertTriangle className="h-3 w-3 mt-0.5"/> Saving replaces all durations. Keys linked to removed durations become base-product stock (variant_id → null).</p>
          </CardContent>
          )}
        </Card>

        {/* Stock per duration — live from Inventory (automatic delivery uses this) */}
        <Card className={`border-zinc-700 ${isAutomatic ? 'border-emerald-600/20' : 'border-zinc-700'}`}>
          <CardHeader><CardTitle className={`flex items-center gap-2 text-sm ${isAutomatic ? 'text-emerald-400' : 'text-zinc-300'}`}><Key className="h-4 w-4"/> Stock per duration {isAutomatic ? <span className="text-xs font-normal text-zinc-500">(from Inventory — automatic delivery uses this)</span> : <span className="text-xs font-normal text-zinc-500">(live inventory count)</span>}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!hasVariants ? (
              (()=>{ const av = inventory.filter(i=>i.status==='available' && !i.variant_id).length; const tot = inventory.filter(i=> !i.variant_id).length; const out = av===0; return (
                <div className={`flex justify-between items-center rounded-lg px-3 py-2 text-sm ${out ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'}`}>
                  <span className="font-medium">{form.name || 'Base product'}</span>
                  <span className="font-mono text-xs">{av} available • {tot} total{out ? ' — out of stock' : ''}</span>
                </div>
              )})()
            ) : durations.length===0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">No durations — add durations above to see stock per option.</p>
            ) : (
              <div className="grid gap-1.5">
                {durations.map((d,idx)=>{
                  // try to match inventory by variant id if exists, otherwise by index fallback
                  const vid = (d as any).id
                  const av = vid ? inventory.filter(i=>i.variant_id===vid && i.status==='available').length : 0
                  const tot = vid ? inventory.filter(i=>i.variant_id===vid).length : 0
                  const out = av===0
                  return (
                    <div key={idx} className={`flex justify-between items-center rounded-lg px-3 py-2 text-sm ${out ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'}`}>
                      <span className="font-medium">{d.name || `Option ${idx+1}`}{d.price ? ` — ${d.price} DZD` : ''}</span>
                      <span className="font-mono text-xs">{av} available • {tot} total{out ? ' — out of stock' : ''}</span>
                    </div>
                  )
                })}
                {isAutomatic && <p className="text-[11px] text-zinc-500 pt-1">To add stock: go to <Link href="/admin/inventory" className="text-violet-400 hover:underline">Inventory</Link> → select this product → choose duration → paste codes.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1 h-12">{saving? <Loader2 className="h-4 w-4 animate-spin"/>: <><Save className="h-4 w-4"/> Save Changes</>}</Button>
          <Link href="/admin/inventory" className="flex-1"><Button type="button" variant="outline" className="w-full h-12"><Key className="h-4 w-4"/> Manage Keys in Inventory</Button></Link>
        </div>
      </form>
    </div>
  )
}
