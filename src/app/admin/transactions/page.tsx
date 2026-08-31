'use client'

import { useState, useEffect, useMemo } from 'react'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, Badge, Input } from '@/app/components/ui/ui'
import { Loader2, Search, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'

interface Tx {
  id: string
  user_id: string
  wallet_id: string
  type: string
  amount: number
  balance_before: number
  balance_after: number
  reference: string | null
  description: string | null
  status: string
  created_at: string
  user: { id: string; email: string; full_name: string } | null
}

type Filter = 'all' | 'deposit' | 'purchase' | 'refund' | 'admin_credit' | 'admin_debit' | 'adjustment'

const typeVariant = (t: string) => {
  if (['deposit','refund','admin_credit'].includes(t)) return 'success'
  if (['purchase','admin_debit'].includes(t)) return 'destructive'
  return 'secondary'
}
const typeLabel = (t: string) => t.replace('_',' ')

export default function AdminTransactionsPage(){
  const [all, setAll] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function fetchTxs(){
    setLoading(true)
    try{
      const res = await fetch('/api/admin/transactions')
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'Failed')
      setAll(Array.isArray(data) ? data : [])
    }catch(e){ setMsg(e instanceof Error ? e.message : 'Failed to load') }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ fetchTxs() }, [])

  const counts = useMemo(()=>{
    const c: Record<string,number> = { all: all.length, deposit:0, purchase:0, refund:0, admin_credit:0, admin_debit:0, adjustment:0 }
    for(const t of all){ if(c[t.type] !== undefined) c[t.type]++ }
    return c
  }, [all])

  const filtered = useMemo(()=>{
    return all.filter(t=>{
      if(filter!=='all' && t.type!==filter) return false
      if(search){
        const q = search.toLowerCase()
        const hay = [t.reference||'', t.description||'', t.type, t.status, t.user?.email||'', t.user?.full_name||'', String(t.amount)].join(' ').toLowerCase()
        if(!hay.includes(q)) return false
      }
      return true
    })
  }, [all, filter, search])

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'deposit', label: 'Deposits' },
    { key: 'purchase', label: 'Purchases' },
    { key: 'refund', label: 'Refunds' },
    { key: 'admin_credit', label: 'Admin Credit' },
    { key: 'admin_debit', label: 'Admin Debit' },
  ]

  const totalIn = useMemo(()=> filtered.filter(t=>['deposit','refund','admin_credit'].includes(t.type)).reduce((s,t)=>s+Number(t.amount),0), [filtered])
  const totalOut = useMemo(()=> filtered.filter(t=>['purchase','admin_debit'].includes(t.type)).reduce((s,t)=>s+Number(t.amount),0), [filtered])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Wallet className="h-6 w-6 text-violet-400" /> Transactions</h1>
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
                  <Input placeholder="Search email, reference, description, amount..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 bg-zinc-950" />
                </div>
                {filtered.length>0 && (
                  <div className="flex gap-4 text-xs">
                    <span className="text-emerald-400 flex items-center gap-1"><ArrowDownRight className="h-3 w-3" /> In: +{totalIn.toFixed(2)} DZD</span>
                    <span className="text-red-400 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Out: -{totalOut.toFixed(2)} DZD</span>
                    <span className="text-zinc-500">Net: {(totalIn-totalOut).toFixed(2)} DZD</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-left">Reference</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" /></td></tr>
                    ) : filtered.length===0 ? (
                      <tr><td colSpan={7} className="p-10 text-center text-zinc-500">{search ? `No transactions match "${search}"` : `No ${filter!=='all'?filter:''} transactions yet.`}</td></tr>
                    ) : filtered.map(t=> {
                      const isCredit = ['deposit','refund','admin_credit'].includes(t.type)
                      return (
                        <tr key={t.id} className="hover:bg-zinc-900/30 align-top">
                          <td className="p-3 text-xs text-zinc-500 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="p-3">
                            <div className="font-medium text-white text-xs">{t.user?.full_name || '—'}</div>
                            <div className="text-[11px] text-zinc-500">{t.user?.email || t.user_id.slice(0,8)}</div>
                          </td>
                          <td className="p-3"><Badge variant={typeVariant(t.type) as any} className="capitalize text-[11px]">{typeLabel(t.type)}</Badge></td>
                          <td className={`p-3 text-right font-mono font-bold whitespace-nowrap ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'}{Number(t.amount).toFixed(2)} <span className="text-[10px] text-zinc-500">DZD</span>
                          </td>
                          <td className="p-3 text-right font-mono text-xs">
                            <span className="text-zinc-500">{Number(t.balance_before).toFixed(2)}</span>
                            <span className="text-zinc-600 mx-1">→</span>
                            <span className="text-white">{Number(t.balance_after).toFixed(2)}</span>
                          </td>
                          <td className="p-3 max-w-[180px]">
                            <div className="text-xs text-zinc-300 truncate" title={t.reference||''}>{t.reference || '—'}</div>
                            {t.description && <div className="text-[11px] text-zinc-500 truncate max-w-[180px]" title={t.description}>{t.description}</div>}
                          </td>
                          <td className="p-3"><Badge variant={t.status==='completed' ? 'success' : t.status==='pending' ? 'warning' : 'destructive'} className="text-[11px]">{t.status}</Badge></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-zinc-600">Live data from <code className="text-zinc-400">wallet_transactions</code> joined with <code className="text-zinc-400">profiles</code>. Use filters and search to audit. Wallet credit/debit actions are logged via Admin → Users → ± Balance.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
