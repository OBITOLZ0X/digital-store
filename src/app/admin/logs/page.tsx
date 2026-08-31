'use client'

import { useState, useEffect, useMemo } from 'react'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, Badge, Input } from '@/app/components/ui/ui'
import { Loader2, Search, FileText, Shield } from 'lucide-react'

interface Log {
  id: string
  admin_id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  admin: { id: string; email: string; full_name: string } | null
}

export default function AdminLogsPage(){
  const [all, setAll] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function fetchLogs(){
    setLoading(true)
    try{
      const res = await fetch('/api/admin/logs')
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'Failed')
      setAll(Array.isArray(data) ? data : [])
    }catch(e){ setMsg(e instanceof Error ? e.message : 'Failed') }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ fetchLogs() }, [])

  const types = useMemo(()=>{
    const s = new Set(all.map(l=>l.entity_type))
    return ['all', ...Array.from(s)]
  }, [all])

  const filtered = useMemo(()=>{
    return all.filter(l=>{
      if(filter!=='all' && l.entity_type!==filter) return false
      if(search){
        const q = search.toLowerCase()
        const hay = [l.action, l.entity_type, l.entity_id||'', l.admin?.email||'', l.admin?.full_name||'', JSON.stringify(l.details||'')].join(' ').toLowerCase()
        if(!hay.includes(q)) return false
      }
      return true
    })
  }, [all, filter, search])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="h-6 w-6 text-violet-400" /> Audit Logs</h1>
          <span className="text-xs text-zinc-500">{filtered.length} / {all.length} entries</span>
        </div>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-4">
            <AdminMobileNav />
            {msg && <div className="rounded-xl p-3 border text-sm bg-red-500/10 border-red-500/20 text-red-400">{msg}</div>}

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {types.map(t=>(
                    <button
                      key={t}
                      onClick={()=>setFilter(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition ${filter===t ? 'bg-violet-600 border-violet-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {t.replace('_',' ')}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input placeholder="Search action, entity, admin, details..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 bg-zinc-950" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400">
                      <th className="p-3 text-left">Time</th>
                      <th className="p-3 text-left">Admin</th>
                      <th className="p-3 text-left">Action</th>
                      <th className="p-3 text-left">Entity</th>
                      <th className="p-3 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" /></td></tr>
                    ) : filtered.length===0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-zinc-500">{search || filter!=='all' ? 'No logs match filter.' : 'No audit logs yet. Actions like product/category/order changes will appear here.'}</td></tr>
                    ) : filtered.map(l=>(
                      <tr key={l.id} className="hover:bg-zinc-900/30 align-top">
                        <td className="p-3 text-xs text-zinc-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <div className="font-medium text-white text-xs flex items-center gap-1"><Shield className="h-3 w-3 text-violet-400" />{l.admin?.full_name || '—'}</div>
                          <div className="text-[11px] text-zinc-500">{l.admin?.email}</div>
                        </td>
                        <td className="p-3"><Badge variant="secondary" className="text-[11px]">{l.action}</Badge></td>
                        <td className="p-3">
                          <div className="text-xs text-white capitalize">{l.entity_type.replace('_',' ')}</div>
                          {l.entity_id && <div className="text-[11px] font-mono text-zinc-500 truncate max-w-[120px]">{l.entity_id.slice(0,8)}</div>}
                        </td>
                        <td className="p-3 max-w-[320px]">
                          {l.details ? (
                            <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg p-2 overflow-x-auto max-h-20">{JSON.stringify(l.details, null, 2)}</pre>
                          ) : <span className="text-xs text-zinc-600">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-zinc-600">Live data from <code className="text-zinc-400">admin_logs</code>. Logged automatically on product, category, order, inventory and wallet admin actions.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
