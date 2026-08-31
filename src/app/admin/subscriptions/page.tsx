'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, Badge, Input } from '@/app/components/ui/ui'
import { Loader2, Search, Tv, Clock } from 'lucide-react'

interface Sub {
  id: string
  status: string
  start_date: string
  expiration_date: string
  auto_renew: boolean
  credentials_ref: string | null
  user: { id: string; email: string; full_name: string } | null
  product: { id: string; name: string; slug: string } | null
  variant: { id: string; name: string } | null
  order: { id: string; order_number: string } | null
  inventory: { id: string; product_data: Record<string,string> } | null
}

type Filter = 'all' | 'active' | 'expiring_soon' | 'expired' | 'cancelled' | 'suspended'

export default function AdminSubscriptionsPage(){
  const [all, setAll] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function fetchSubs(){
    setLoading(true)
    try{
      const res = await fetch('/api/admin/subscriptions')
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'Failed')
      setAll(Array.isArray(data) ? data : [])
    }catch(e){ setMsg(e instanceof Error ? e.message : 'Failed') }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ fetchSubs() }, [])

  const counts = useMemo(()=>{
    const c: Record<string,number> = { all: all.length, active:0, expiring_soon:0, expired:0, cancelled:0, suspended:0 }
    for(const s of all){ if(c[s.status]!==undefined) c[s.status]++ }
    return c
  }, [all])

  const filtered = useMemo(()=>{
    return all.filter(s=>{
      if(filter!=='all' && s.status!==filter) return false
      if(search){
        const q = search.toLowerCase()
        const hay = [s.user?.email||'', s.user?.full_name||'', s.product?.name||'', s.variant?.name||'', s.order?.order_number||'', s.status].join(' ').toLowerCase()
        if(!hay.includes(q)) return false
      }
      return true
    })
  }, [all, filter, search])

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expiring_soon', label: 'Expiring Soon' },
    { key: 'expired', label: 'Expired' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Tv className="h-6 w-6 text-violet-400" /> Subscriptions</h1>
          <span className="text-xs text-zinc-500">{filtered.length} / {all.length} records</span>
        </div>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-4">
            <AdminMobileNav />
            {msg && <div className="rounded-xl p-3 border text-sm bg-red-500/10 border-red-500/20 text-red-400">{msg}</div>}

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tabs.map(t=>(
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
                  <Input placeholder="Search user, product, order..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 bg-zinc-950" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400">
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Order</th>
                      <th className="p-3 text-left">Start</th>
                      <th className="p-3 text-left">Expires</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-right">Credentials</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" /></td></tr>
                    ) : filtered.length===0 ? (
                      <tr><td colSpan={7} className="p-10 text-center text-zinc-500">{search ? `No subscriptions match "${search}"` : `No ${filter!=='all'?filter:''} subscriptions yet.`}</td></tr>
                    ) : filtered.map(s=>{
                      const daysLeft = Math.ceil((new Date(s.expiration_date).getTime() - Date.now())/(86400000))
                      const expiring = daysLeft <=7 && daysLeft >=0 && s.status==='active'
                      return (
                        <tr key={s.id} className={`hover:bg-zinc-900/30 align-top ${expiring ? 'bg-amber-500/5' : ''}`}>
                          <td className="p-3">
                            <div className="font-medium text-white text-xs">{s.user?.full_name || '—'}</div>
                            <div className="text-[11px] text-zinc-500">{s.user?.email}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-white text-xs">{s.product?.name || '—'}{s.variant ? ` — ${s.variant.name}` : ''}</div>
                            <div className="text-[11px] text-zinc-500">{s.product?.slug}</div>
                          </td>
                          <td className="p-3 font-mono text-xs text-violet-400">{s.order?.order_number || '—'}</td>
                          <td className="p-3 text-xs text-zinc-400 whitespace-nowrap">{new Date(s.start_date).toLocaleDateString()}</td>
                          <td className="p-3 text-xs whitespace-nowrap">
                            <div className="text-zinc-300">{new Date(s.expiration_date).toLocaleDateString()}</div>
                            <div className={`text-[11px] flex items-center gap-1 ${daysLeft<0 ? 'text-red-400' : expiring ? 'text-amber-400' : 'text-zinc-500'}`}><Clock className="h-3 w-3" />{daysLeft>0 ? `${daysLeft} days left` : daysLeft===0 ? 'Expires today' : 'Expired'}</div>
                          </td>
                          <td className="p-3"><Badge variant={s.status==='active'?'success': s.status==='expiring_soon'?'warning': s.status==='expired'?'destructive': 'secondary'} className="text-[11px] capitalize">{s.status.replace('_',' ')}</Badge></td>
                          <td className="p-3 text-right">
                            {s.inventory?.product_data ? (
                              <div className="inline-block text-left rounded-lg bg-zinc-950 border border-zinc-800 p-2 font-mono text-[11px] max-w-[180px]">
                                {Object.entries(s.inventory.product_data).filter(([k])=>k!=='delivered_by').slice(0,2).map(([k,v])=>(
                                  <div key={k} className="truncate"><span className="text-zinc-500">{k}:</span> <span className="text-white">{String(v).slice(0,24)}</span></div>
                                ))}
                                {s.auto_renew && <div className="text-[10px] text-emerald-400 mt-1">auto-renew</div>}
                              </div>
                            ) : <span className="text-xs text-zinc-600">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-zinc-600">Live data from <code className="text-zinc-400">subscriptions</code> joined with users, products, variants and orders. Credentials from linked inventory item (filtered delivered_by). Expiring soon = ≤7 days.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
