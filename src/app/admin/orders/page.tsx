'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, Badge, Button, Textarea, Input } from '@/app/components/ui/ui'
import { Loader2, Send, XCircle, ChevronDown, ChevronUp, Mail, MailCheck, PackageCheck, Copy, Check, AlertTriangle, Zap, Search } from 'lucide-react'

interface OrderItem { product_id: string; product_name: string; variant_name: string | null; quantity: number; unit_price: number }
interface Order {
  id: string; order_number: string; status: string; delivery_status: string
  total: number; currency: string; payment_method: string; created_at: string; notes: string | null
  delivery_type: string | null
  product_stock: number | null
  variant_stock: number | null
  user: { id: string; email: string; full_name: string } | null
  items: OrderItem[]
  inventory: { id: string; product_data: Record<string,string>; status: string; variant_id: string|null; sold_at: string|null }[]
}

const statusVariant = (s: string) =>
  s === 'completed' ? 'success' : s === 'refunded' || s === 'cancelled' ? 'destructive' : s === 'processing' ? 'warning' : 'secondary'

type Filter = 'all' | 'pending' | 'completed' | 'cancelled' | 'auto' | 'manual' | 'failed'

export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, string>>({})
  const [remaining, setRemaining] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setAllOrders(data as Order[])
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' }) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchOrders() }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allOrders.length, pending: 0, completed: 0, cancelled: 0, auto: 0, manual: 0, failed: 0 }
    for (const o of allOrders) {
      if (['pending','processing'].includes(o.status) && o.delivery_status === 'pending') c.pending++
      if (o.status === 'completed') c.completed++
      if (['cancelled','refunded'].includes(o.status) || o.delivery_status === 'failed') c.cancelled++
      if (o.delivery_status === 'failed') c.failed++
      if (o.delivery_type === 'automatic') c.auto++
      else c.manual++
    }
    return c
  }, [allOrders])

  const filtered = useMemo(() => {
    return allOrders.filter(o => {
      if (filter === 'pending' && !(['pending','processing'].includes(o.status) && o.delivery_status === 'pending')) return false
      if (filter === 'completed' && o.status !== 'completed') return false
      if (filter === 'cancelled' && !(['cancelled','refunded'].includes(o.status) || o.delivery_status === 'failed')) return false
      if (filter === 'failed' && o.delivery_status !== 'failed') return false
      if (filter === 'auto' && o.delivery_type !== 'automatic') return false
      if (filter === 'manual' && o.delivery_type === 'automatic') return false
      if (search) {
        const q = search.toLowerCase()
        const hay = [o.order_number, o.user?.email, o.user?.full_name, o.status, o.delivery_status, o.delivery_type, ...(o.items||[]).map(i=>i.product_name + ' ' + (i.variant_name||''))].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [allOrders, filter, search])

  async function deliver(orderId: string) {
    const c = (content[orderId] || '').trim()
    if (!c) { setMsg({ ok: false, text: 'Enter the code / account / delivery details first.' }); return }
    // For manual orders, remaining stock is required to keep product stock accurate
    const order = allOrders.find(o=>o.id===orderId)
    const isManualDeliver = order ? order.delivery_type !== 'automatic' : false
    const remRaw = (remaining[orderId] || '').trim()
    if (isManualDeliver && remRaw !== '' && (!/^\d+$/.test(remRaw) || Number(remRaw) < 0)) {
      setMsg({ ok: false, text: 'Remaining stock must be a whole number >= 0.' }); return
    }
    setBusy(orderId); setMsg(null)
    try {
      const payload: Record<string, unknown> = { action: 'deliver', delivery_content: c }
      if (remRaw !== '') payload.remaining_stock = Number(remRaw)
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMsg({ ok: true, text: `Delivered ✅ — buyer notified in-app${data.emailSent ? ' + email sent 📧' : ' (email not configured — in-app only)'}` })
      fetchOrders()
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' }) }
    finally { setBusy(null) }
  }

  async function cancel(orderId: string) {
    const reason = prompt('Cancel reason (shown to buyer):')
    if (reason === null) return
    setBusy(orderId); setMsg(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', reason }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMsg({ ok: true, text: 'Order cancelled & refunded' })
      fetchOrders()
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' }) }
    finally { setBusy(null) }
  }

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(()=>setCopied(null), 1500)
  }

  const filterTabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled / Failed' },
    { key: 'auto', label: 'Auto delivery' },
    { key: 'manual', label: 'Manual' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{filtered.length} / {allOrders.length} orders</span>
          </div>
        </div>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-4">
            <AdminMobileNav />
            {msg && <div className={`rounded-xl p-3 border text-sm ${msg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>}

            {/* Filters */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {filterTabs.map(t => (
                    <button
                      key={t.key}
                      onClick={()=>setFilter(t.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filter===t.key ? 'bg-violet-600 border-violet-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {t.label} <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${filter===t.key ? 'bg-white/20 text-white' : 'bg-zinc-900 text-zinc-400'}`}>{counts[t.key] ?? 0}</span>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input placeholder="Search order number, email, product..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 bg-zinc-950" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400">
                      <th className="p-3 text-left">Order</th>
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-left">Items</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Delivery</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" /></td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={7} className="p-10 text-center text-zinc-500">{search ? `No orders match "${search}"` : filter==='all' ? 'No orders yet.' : `No ${filter} orders.`}</td></tr>
                    ) : filtered.map(o => {
                      const isOpen = open === o.id
                      const needsAction = ['pending', 'processing'].includes(o.status) && o.delivery_status === 'pending'
                      const isAutoDelivered = o.status === 'completed' && o.delivery_status === 'delivered' && o.inventory?.length > 0
                      const isAuto = o.delivery_type === 'automatic'
                      const isCancelled = o.status === 'cancelled' || o.status === 'refunded' || o.delivery_status === 'failed'
                      return (
                        <React.Fragment key={o.id}>
                          <tr className={`align-top hover:bg-zinc-900/30 ${needsAction ? 'bg-amber-500/5' : isAutoDelivered ? 'bg-emerald-500/5' : isCancelled ? 'bg-red-500/[0.04]' : ''}`}>
                            <td className="p-3">
                              <div className="font-mono font-bold text-white flex items-center gap-1.5">
                                {o.order_number}
                                {isAuto && <span title="Automatic delivery" className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30"><Zap className="h-3 w-3" /> AUTO</span>}
                                {!isAuto && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 border border-zinc-600">MANUAL</span>}
                              </div>
                              <div className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleString()}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-white">{o.user?.full_name || '—'}</div>
                              <div className="text-xs text-zinc-500">{o.user?.email}</div>
                            </td>
                            <td className="p-3 text-zinc-300 max-w-[220px]">
                              {o.items?.length ? o.items.map((it, i) => (
                                <div key={i} className="truncate">{it.product_name}{it.variant_name ? ` (${it.variant_name})` : ''} ×{it.quantity}</div>
                              )) : <span className="text-zinc-500 italic text-xs">No items (cancelled before confirm)</span>}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-white">{Number(o.total).toFixed(2)} <span className="text-xs text-zinc-500">{o.currency}</span></td>
                            <td className="p-3"><Badge variant={statusVariant(o.status) as any}>{o.status}</Badge></td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                <Badge variant={o.delivery_status === 'delivered' ? 'success' : o.delivery_status === 'failed' ? 'destructive' : 'warning'}>
                                  {isAutoDelivered ? 'Auto • delivered' : o.delivery_status}
                                </Badge>
                                {isAuto && o.delivery_status !== 'delivered' && !isCancelled && <span className="text-[10px] text-violet-400">via Inventory</span>}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1">
                                {needsAction && (
                                  <Button size="sm" variant="destructive" onClick={() => cancel(o.id)} disabled={busy === o.id}><XCircle className="h-3 w-3" /></Button>
                                )}
                                <Button size="sm" variant={isOpen ? 'default' : 'outline'} onClick={() => setOpen(isOpen ? null : o.id)}>
                                  {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={7} className="p-4 bg-zinc-950/60 border-b border-zinc-800">
                                {o.status === 'completed' && o.delivery_status === 'delivered' ? (
                                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                                    <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                      <PackageCheck className="h-4 w-4" /> {isAuto ? 'Auto delivered ✓ — buyer already received this' : 'Delivered ✓'}
                                    </div>
                                    {o.inventory?.length ? (
                                      <div className="space-y-2">
                                        {o.inventory.map((inv, idx) => (
                                          <div key={idx} className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm space-y-2">
                                            <div className="text-xs text-zinc-500 mb-1">Delivered code / account {o.inventory.length>1 ? `#${idx+1}` : ''} {inv.sold_at ? `• ${new Date(inv.sold_at).toLocaleString()}` : ''}</div>
                                            {Object.entries(inv.product_data || {}).length === 0 ? (
                                              <div className="text-zinc-500 italic text-xs">No product_data (legacy order)</div>
                                            ) : Object.entries(inv.product_data).filter(([k])=>k!=='delivered_by').map(([k,v])=>(
                                              <div key={k} className="flex items-center justify-between gap-2 bg-zinc-900 rounded-lg px-3 py-2">
                                                <div><span className="text-xs text-zinc-500 block">{k}</span><span className="text-white font-bold break-all">{String(v)}</span></div>
                                                <button onClick={()=>copyText(o.id+'-'+idx+'-'+k, String(v))} className="shrink-0 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
                                                  {copied === o.id+'-'+idx+'-'+k ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-400">No inventory record linked — but order is marked delivered (manual fulfill?).</p>
                                    )}
                                    <p className="text-xs text-zinc-500">Buyer sees this in <span className="text-zinc-300">Orders → {o.order_number}</span>. No further action needed.</p>
                                  </div>
                                ) : isCancelled ? (
                                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
                                    <div className="text-sm font-semibold text-red-400 flex items-center gap-2"><XCircle className="h-4 w-4" /> Order cancelled {o.delivery_status==='failed' ? '• delivery failed' : ''}</div>
                                    <p className="text-xs text-zinc-400">
                                      {o.notes ? `Reason: ${o.notes}` : ''}
                                      {!o.items?.length ? ' — This was an automatic order that failed (no inventory available for the selected variant). Amount was not charged / was refunded. Add stock in Inventory for that duration and the next purchase will auto-deliver.' : ' — Amount refunded to wallet if it was charged.'}
                                    </p>
                                    {o.delivery_type === 'automatic' && !o.inventory?.length && (
                                      <div className="flex gap-2 items-start rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>Auto delivery failed: no available code for <b>{o.items?.[0]?.product_name || 'this product'}{o.items?.[0]?.variant_name ? ` (${o.items[0].variant_name})` : ''}</b> at purchase time. Go to <b>Inventory → {o.items?.[0]?.product_name || 'product'}</b> and add a code for that duration.</span>
                                      </div>
                                    )}
                                  </div>
                                ) : needsAction ? (
                                  <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                      {o.user?.email ? <MailCheck className="h-4 w-4 text-emerald-400" /> : <Mail className="h-4 w-4 text-zinc-500" />}
                                      Fulfill order {o.order_number} — enter what the buyer receives
                                    </div>
                                    {isAuto && <div className="text-xs text-amber-300 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> This product is marked Automatic but order is still pending — inventory was empty at purchase time. Paste a code manually to complete, or cancel & refund.</div>}
                                    <Textarea
                                      rows={3}
                                      placeholder="Paste the license key, login credentials, account details, or gift card code here... (the buyer will see this in their Orders page)"
                                      value={content[o.id] || ''}
                                      onChange={e => setContent(c => ({ ...c, [o.id]: e.target.value }))}
                                      className="bg-zinc-950 font-mono text-sm"
                                    />
                                    {/* Manual stock — remaining quantity */}
                                    {!isAuto && (
                                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                                        <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                                          <PackageCheck className="h-3.5 w-3.5" /> Remaining stock for this product
                                        </div>
                                        {(() => {
                                          const current = o.variant_stock ?? o.product_stock
                                          const qty = o.items?.[0]?.quantity ?? 1
                                          const suggested = current !== null && current !== undefined ? Math.max(0, current - qty) : null
                                          return (
                                            <>
                                              <div className="text-xs text-zinc-400">
                                                {o.items?.[0]?.variant_name ? `Variant: ${o.items[0].variant_name} • ` : ''}Current stock: <b className="text-white">{current ?? '—'}</b> • Ordered: <b className="text-white">{qty}</b> {suggested !== null && <span>• Suggested remaining: <b className="text-emerald-400">{suggested}</b></span>}
                                              </div>
                                              <div className="flex gap-2">
                                                <Input type="number" min={0} placeholder={suggested !== null ? `e.g. ${suggested}` : 'Enter remaining quantity'} value={remaining[o.id] || ''} onChange={e=>setRemaining(r=>({...r, [o.id]: e.target.value}))} className="bg-zinc-950 font-mono" />
                                                {suggested !== null && <Button variant="outline" size="sm" onClick={()=>setRemaining(r=>({...r, [o.id]: String(suggested)}))}>Use {suggested}</Button>}
                                              </div>
                                              <p className="text-[11px] text-zinc-500">Enter how many units remain after this delivery. Leave empty to auto-deduct ({current ?? 0} − {qty} = {suggested ?? 0}). This updates the product/variant stock.</p>
                                            </>
                                          )
                                        })()}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-xs text-zinc-500">Confirming marks the order delivered, notifies the buyer in-app, and emails them (if SMTP configured) to open their Orders page.</p>
                                      <Button onClick={() => deliver(o.id)} disabled={busy === o.id}>
                                        {busy === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Confirm & Deliver
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-2">
                                    <div className="text-sm text-zinc-400">Order status: <b className="text-white">{o.status}</b> • delivery: <b className="text-white">{o.delivery_status}</b> {isAuto ? '• Auto' : '• Manual'}</div>
                                    {o.inventory?.length ? (
                                      <div className="space-y-2">
                                        {o.inventory.map((inv, idx)=>(
                                          <div key={idx} className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs">
                                            {Object.entries(inv.product_data).filter(([k])=>k!=='delivered_by').map(([k,v])=><div key={k} className="flex justify-between"><span className="text-zinc-500">{k}</span><span className="text-white">{String(v)}</span></div>)}
                                          </div>
                                        ))}
                                      </div>
                                    ) : <p className="text-xs text-zinc-500">No delivery content yet.</p>}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-zinc-600">Use the filters above: <b>All</b> shows every order, <b>Completed</b> only completed, <b>Pending</b> awaiting fulfillment, <b>Cancelled / Failed</b> rejected or delivery failed, <b>Auto</b> for auto-delivery, <b>Manual</b> for manual. Search works on order number / email / product name.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
