'use client'
import { useState } from 'react'
import { Button, Input, Badge } from '@/app/components/ui/ui'
import { ShoppingCart, Wallet, Minus, Plus } from 'lucide-react'

export function PurchaseBox({ product, variants }: { product: Record<string,unknown> & {id:string; name:string; price:number; stock:number; delivery_type?:string}; variants: (Record<string,unknown>&{id:string;name:string;price:number;stock:number;duration_days:number|null;inventory_available?:number;inventory_total?:number})[] }){
  const hasVariants = variants.length > 0
  const isAutomatic = (product as { delivery_type?: string }).delivery_type === 'automatic'
  const [selected, setSelected] = useState<string | null>(variants[0]?.id || null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  const activeVariant = variants.find(v=>v.id===selected) || null
  const unitPrice = activeVariant ? Number(activeVariant.price) : Number(product.price)
  // automatic: stock is inventory count (already overridden in getProductBySlug), otherwise variant.stock
  const stock = activeVariant ? Number(activeVariant.stock) : Number(product.stock)
  const total = unitPrice * qty

  async function handlePurchase(){
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/purchase', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId: product.id, variantId: selected || undefined, quantity: qty }) })
      const j = await res.json()
      if (res.status === 401 || j.error?.toLowerCase().includes('unauthorized')) {
        setMsg('🔒 Please login first to purchase with your wallet.')
        setTimeout(()=> window.location.href = '/login?redirect=/products/'+(product as {slug:string}).slug, 1200)
        return
      }
      if (!res.ok) {
        const errMsg = j.error || 'Failed'
        // Insufficient balance -> redirect to wallet deposit with needed amount
        if (errMsg.toLowerCase().includes('insufficient balance')) {
          setMsg(`💳 Insufficient balance. You need ${total.toFixed(2)} DZD. Redirecting to wallet to top up...`)
          setTimeout(()=> window.location.href = `/account/wallet?amount=${Math.ceil(total)}`, 1200)
          return
        }
        throw new Error(errMsg)
      }
      setMsg('✅ Purchase successful! Check your orders and subscriptions.')
      // redirect after short delay
      setTimeout(()=> window.location.href = '/account/orders', 1200)
    } catch(e){
      const m = e instanceof Error ? e.message : 'Purchase failed'
      if (m.toLowerCase().includes('unauthorized')) {
        setMsg('🔒 Please login first to purchase with your wallet.')
        setTimeout(()=> window.location.href = '/login?redirect=/products/'+(product as {slug:string}).slug, 1200)
      } else if (m.toLowerCase().includes('insufficient balance')) {
        setMsg(`💳 Insufficient balance. You need ${total.toFixed(2)} DZD. Redirecting to wallet to top up...`)
        setTimeout(()=> window.location.href = `/account/wallet?amount=${Math.ceil(total)}`, 1200)
      } else {
        setMsg('❌ ' + m)
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      {hasVariants && (
        <div>
          <div className="text-sm font-semibold text-white mb-2">Choose variant</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {variants.map(v=>{
              const vStock = Number(v.stock)
              const isOut = vStock === 0
              return (
              <button key={v.id} onClick={()=>setSelected(v.id)} className={`text-left rounded-xl border p-3 transition ${selected===v.id?'border-violet-600 bg-violet-600/10': isOut ? 'border-red-500/20 bg-zinc-950 opacity-60' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
                <div className="font-medium text-white text-sm flex items-center gap-2">{v.name} {isAutomatic && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Auto</span>}</div>
                <div className={`text-xs ${isOut ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>{v.duration_days? `${v.duration_days} days` : ''} • {Number(v.price).toFixed(2)} DZD • {isOut ? 'Out of stock' : `${vStock} available`}</div>
              </button>
            )})}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Quantity</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus className="h-4 w-4"/></Button>
          <span className="w-10 text-center font-bold text-white">{qty}</span>
          <Button variant="outline" size="icon" onClick={()=>setQty(q=>Math.min(stock,q+1))}><Plus className="h-4 w-4"/></Button>
        </div>
      </div>
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-sm">
        <div className="flex justify-between text-zinc-400"><span>Unit price</span><span className="text-white">{unitPrice.toFixed(2)} DZD</span></div>
        <div className="flex justify-between text-zinc-400"><span>Quantity</span><span className="text-white">× {qty}</span></div>
        <div className="flex justify-between font-bold text-white border-t border-zinc-800 pt-2"><span>Total</span><span className="text-violet-400">{total.toFixed(2)} DZD</span></div>
        <div className="flex items-center gap-2 text-xs text-zinc-500"><Wallet className="h-3 w-3"/> Pay with wallet balance</div>
      </div>
      <Button onClick={handlePurchase} disabled={loading || stock===0} className="w-full rounded-xl h-12 text-base">
        {loading ? 'Processing...' : <><ShoppingCart className="h-4 w-4"/> Confirm Purchase — {total.toFixed(2)} DZD</>}
      </Button>
      {msg && <div className="text-sm rounded-xl p-3 bg-zinc-950 border border-zinc-800 text-zinc-300">{msg}</div>}
      <p className="text-xs text-zinc-600 text-center">Server-side price & stock verification • No Stripe</p>
    </div>
  )
}
