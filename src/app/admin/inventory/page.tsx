'use client'
import { useState, useEffect } from 'react'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Button, Input, Label, Select, Textarea, Card, CardContent, CardHeader, CardTitle, Badge } from '@/app/components/ui/ui'
import { Plus, Trash2, Loader2, Package, Key, Copy, Filter } from 'lucide-react'

type Product = { id:string; name:string; slug:string; variants?: Variant[] }
type Variant = { id:string; name:string; product_id:string; duration_days?:number|null; price?:number }
type Item = { id:string; product_id:string; variant_id:string|null; product_data:Record<string,string>; status:string; order_id:string|null; created_at:string; product?:Product & {status?:string}|null; variant?:Variant|null }

export default function AdminInventoryPage(){
  const [items, setItems] = useState<Item[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ok:boolean;text:string}|null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProduct, setFilterProduct] = useState<string>('')
  // add form
  const [formProduct, setFormProduct] = useState('')
  const [formVariant, setFormVariant] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [singleData, setSingleData] = useState('{"email":"","password":"","code":""}')

  async function load(){
    setLoading(true)
    try{
      const [invRes, prodRes] = await Promise.all([
        fetch(`/api/admin/inventory${filterStatus || filterProduct ? `?${new URLSearchParams({...filterStatus&&{status:filterStatus}, ...filterProduct&&{product_id:filterProduct}}).toString()}`:''}`),
        fetch('/api/admin/products')
      ])
      const inv = await invRes.json()
      if (Array.isArray(inv)) setItems(inv)
      else if (inv.error) setMsg({ok:false,text:inv.error})
      const prodData = await prodRes.json()
      const list = Array.isArray(prodData) ? prodData : prodData.data || []
      // Hide archived (soft-deleted) products from add-dropdown — they remain visible in inventory table as "Deleted product"
      const activeList = list.filter((p:any)=>p.status!=='archived')
      setProducts(activeList.map((p:any)=>({id:p.id,name:p.name,slug:p.slug, variants: p.variants || []})))
    }catch(e){ setMsg({ok:false,text:e instanceof Error?e.message:'Failed'}) }
    finally{ setLoading(false)}
  }
  // load variants when product selected — uses cached products list (includes variants) for instant display
  async function loadVariants(productId:string){
    if (!productId){ setVariants([]); return }
    // Fast path: from already loaded products list
    const cached = products.find(p=>p.id===productId)
    if (cached && Array.isArray(cached.variants) && cached.variants.length>0) {
      setVariants(cached.variants)
      return
    }
    // If product has variants but not in cache yet (or cache empty), fetch
    try{
      const res = await fetch(`/api/admin/products/${productId}`)
      const j = await res.json()
      if (res.ok && Array.isArray(j.variants) && j.variants.length>0) {
        setVariants(j.variants)
        return
      }
      const r2 = await fetch('/api/admin/products')
      const list = await r2.json()
      const prod = (Array.isArray(list) ? list : []).find((p:any)=>p.id===productId)
      setVariants(prod?.variants || [])
    }catch{ setVariants([]) }
  }
  useEffect(()=>{ load() },[filterStatus, filterProduct])
  // Keep variants in sync when both product selection and products list are ready
  useEffect(()=>{
    if(formProduct) {
      const cached = products.find(p=>p.id===formProduct)
      if (cached) setVariants(cached.variants || [])
      else loadVariants(formProduct)
    } else setVariants([])
  },[formProduct, products])

  async function handleAdd(e:React.FormEvent){
    e.preventDefault()
    if(!formProduct){ setMsg({ok:false,text:'Select a product'}); return }
    // either bulkText or singleData
    let payload:any = { product_id: formProduct, variant_id: formVariant || null }
    if (bulkText.trim()){
      payload.bulk_text = bulkText
    } else {
      try{
        const pd = JSON.parse(singleData)
        // clean empty
        const cleaned:Record<string,string> = {}
        Object.entries(pd).forEach(([k,v])=>{ if(String(v).trim()) cleaned[k]=String(v).trim() })
        if (!Object.keys(cleaned).length){ setMsg({ok:false,text:'Enter at least one field or use bulk'}); return }
        payload.product_data = cleaned
      }catch{ setMsg({ok:false,text:'Single data must be valid JSON'}); return }
    }
    setSaving(true); setMsg(null)
    try{
      const res = await fetch('/api/admin/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const j = await res.json()
      if(!res.ok) throw new Error(j.error||'Failed')
      setMsg({ok:true,text:`✅ Added ${j.data?.length||1} item(s)`})
      setBulkText(''); setSingleData('{"email":"","password":"","code":""}'); setFormVariant('')
      load()
    }catch(err){ setMsg({ok:false,text:err instanceof Error?err.message:'Failed'}) } finally{ setSaving(false) }
  }

  async function del(id:string){
    if(!confirm('Delete this inventory item?')) return
    setMsg(null)
    const res = await fetch(`/api/admin/inventory/${id}`,{method:'DELETE'})
    const j = await res.json()
    if(!res.ok){ setMsg({ok:false,text:j.error||'Delete failed'}) } else { setMsg({ok:true,text:'Deleted'}); load() }
  }
  async function toggleStatus(it:Item){
    const next = it.status==='available' ? 'disabled' : 'available'
    if(it.status==='sold' || it.status==='reserved'){ setMsg({ok:false,text:'Cannot toggle sold/reserved'}); return }
    const res = await fetch(`/api/admin/inventory/${it.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:next})})
    const j = await res.json()
    if(!res.ok) setMsg({ok:false,text:j.error}); else load()
  }

  const stats = {
    total: items.length,
    available: items.filter(i=>i.status==='available').length,
    sold: items.filter(i=>i.status==='sold').length,
    reserved: items.filter(i=>i.status==='reserved').length,
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package className="h-6 w-6 text-violet-400"/> Inventory <span className="text-sm font-normal text-zinc-500">— keys & accounts to deliver</span></h1>
          <div className="text-xs text-zinc-500">{stats.available} available • {stats.sold} sold • {stats.reserved} reserved</div>
        </div>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-6">
            <AdminMobileNav />
            {msg && <div className={`rounded-xl p-3 border text-sm ${msg.ok?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>}

            {/* Filters */}
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-3 items-end">
                <div><Label>Status</Label>
                  <Select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="mt-1.5 min-w-[160px]">
                    <option value="">All statuses</option>
                    <option value="available">available</option>
                    <option value="reserved">reserved</option>
                    <option value="sold">sold</option>
                    <option value="disabled">disabled</option>
                  </Select>
                </div>
                <div><Label>Product</Label>
                  <Select value={filterProduct} onChange={e=>setFilterProduct(e.target.value)} className="mt-1.5 min-w-[200px]">
                    <option value="">All products</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={()=>{setFilterStatus(''); setFilterProduct('')}}><Filter className="h-3 w-3"/> Clear</Button>
                <div className="ml-auto text-xs text-zinc-600">Stock per duration is now shown in <a href="/admin/products" className="text-violet-400 hover:underline">Products</a> → Edit → Stock per duration</div>
              </CardContent>
            </Card>

            {/* Add form */}
            <Card className="border-violet-600/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4"/> Add Inventory</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Product *</Label>
                      <Select value={formProduct} onChange={e=>{setFormProduct(e.target.value); setFormVariant('')}} required className="mt-1.5">
                        <option value="">Select product</option>
                        {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label>Variant / Duration {variants.length>0 ? <span className="text-violet-400">* — This product has {variants.length} durations</span> : <span className="text-zinc-500">(optional)</span>}</Label>
                      <Select value={formVariant} onChange={e=>setFormVariant(e.target.value)} className="mt-1.5">
                        <option value="">{variants.length>0 ? '⚠️ Select a duration — required for variant products' : 'Base product (no variant)'}</option>
                        {variants.map(v=><option key={v.id} value={v.id}>{v.name} • {v.duration_days ? `${v.duration_days} days` : ''}</option>)}
                      </Select>
                      {variants.length>0 && !formVariant && <p className="text-xs text-amber-400 mt-1">This inventory item will be linked to the selected duration. When a customer buys that duration, it will be delivered from its own stock.</p>}
                      {variants.length>0 && formVariant && <p className="text-xs text-emerald-400 mt-1">✓ This code will be delivered only when customer buys: <strong>{variants.find(v=>v.id===formVariant)?.name}</strong></p>}
                    </div>
                  </div>

                  <div>
                    <Label>Bulk add — one per line (fastest)</Label>
                    <Textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} rows={4} placeholder={"user@example.com:Pass123\nCODE-ABC-123\nuser | pass | notes"} className="mt-1.5 font-mono text-sm"/>
                    <p className="text-xs text-zinc-500 mt-1">Formats: <code>email:password</code> • <code>CODE-...</code> • <code>email | password | notes</code> — each line = 1 unit sold.</p>
                  </div>

                  <div className="text-center text-xs text-zinc-600">— or —</div>

                  <div>
                    <Label>Single item JSON</Label>
                    <Input value={singleData} onChange={e=>setSingleData(e.target.value)} placeholder='{"email":"a@b.com","password":"123","code":"XYZ"}' className="mt-1.5 font-mono text-sm"/>
                    <p className="text-xs text-zinc-500 mt-1">Any keys you use in <code>product_data</code> will be shown to buyer in <code>Orders → Order detail</code>.</p>
                  </div>

                  <Button type="submit" disabled={saving || !formProduct} className="w-full">
                    {saving? <><Loader2 className="h-4 w-4 animate-spin"/> Saving...</> : <><Key className="h-4 w-4"/> Add to Stock</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader><CardTitle>Stock — {loading ? '...' : `${items.length} items`}</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-zinc-900/50 border-y border-zinc-800 text-xs text-zinc-400">
                    <th className="p-3 text-left">Product / Variant</th>
                    <th className="p-3 text-left">Data (product_data)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-left">Order</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto"/></td></tr>
                    ) : items.length===0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-zinc-500">No inventory yet. Add keys above — automatic products deliver instantly from this stock.</td></tr>
                    ) : items.map(it=>{
                      const isDeletedProduct = !it.product || (it.product as any)?.status === 'archived'
                      return (
                      <tr key={it.id} className={`align-top ${isDeletedProduct ? 'bg-zinc-800/20 opacity-40 grayscale' : 'hover:bg-zinc-900/30'}`}>
                        <td className="p-3">
                          <div className="font-medium flex items-center gap-1.5">
                            <span className={it.product ? 'text-white' : 'text-zinc-500 italic'}>{it.product?.name || '— Deleted product'}</span>
                            {it.product?.status === 'archived' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">deleted</span>}
                            {!it.product && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">deleted</span>}
                          </div>
                          <div className="text-xs text-zinc-500">{it.variant?.name || (it.variant_id ? it.variant_id.slice(0,8) : '— base')}</div>
                          <div className="text-[10px] text-zinc-600 font-mono">{it.product_id.slice(0,8)} • {new Date(it.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3 max-w-[360px]">
                          <div className={`rounded-lg border p-2 font-mono text-xs space-y-1 ${isDeletedProduct ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-zinc-950 border-zinc-800'}`}>
                            {Object.entries(it.product_data).length===0 ? <span className="text-zinc-600">empty</span> : Object.entries(it.product_data).map(([k,v])=>(
                              <div key={k} className="flex justify-between gap-2"><span className="text-zinc-500">{k}</span><span className="text-white flex items-center gap-1">{String(v)}<button type="button" onClick={()=>navigator.clipboard.writeText(String(v))} className="text-violet-400 disabled:text-zinc-600" disabled={isDeletedProduct}><Copy className="h-3 w-3"/></button></span></div>
                            ))}
                            {it.product_data?.delivery && <div className="text-amber-400 text-[10px]">↳ admin-delivered</div>}
                            {isDeletedProduct && <div className="text-[10px] text-zinc-500 italic">Product deleted — not usable</div>}
                          </div>
                        </td>
                        <td className="p-3 text-center"><Badge variant={isDeletedProduct ? 'outline' : it.status==='available'?'success': it.status==='sold'?'secondary': it.status==='reserved'?'warning':'outline'}>{isDeletedProduct ? 'deleted-product' : it.status}</Badge></td>
                        <td className="p-3 text-xs text-zinc-500">{it.order_id ? <a href={`/admin/orders`} className={`hover:underline ${isDeletedProduct ? 'text-zinc-600 pointer-events-none' : 'text-violet-400'}`}>{it.order_id.slice(0,8)}</a> : '—'}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" disabled={isDeletedProduct || it.status==='sold' || it.status==='reserved'} onClick={()=>toggleStatus(it)}>{it.status==='available'?'Disable':'Enable'}</Button>
                            <Button size="sm" variant="destructive" disabled={isDeletedProduct || it.status==='sold'} onClick={()=>del(it.id)}><Trash2 className="h-3 w-3"/></Button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-zinc-600">Automatic products are delivered from <code>available</code> stock instantly (FIFO by <code>created_at</code>). Manual products are fulfilled from <code>admin/orders → Confirm & Deliver</code> and also appear here as <code>sold</code>.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
