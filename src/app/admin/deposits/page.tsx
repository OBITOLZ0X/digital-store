'use client'

import { useState, useEffect } from 'react'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, Badge, Button } from '@/app/components/ui/ui'
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react'

interface Deposit {
  id: string; amount: number; currency: string; payment_method: string
  reference_number: string | null; screenshot_url: string | null; notes: string | null
  status: 'pending' | 'approved' | 'rejected'; rejection_reason: string | null
  created_at: string; user: { id: string; email: string; full_name: string } | null
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function fetchDeposits(f = filter) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/deposits${f === 'pending' ? '?status=pending' : ''}`)
      const data = await res.json()
      if (res.ok) setDeposits(data)
      else setMsg({ ok: false, text: data.error || 'Failed to load' })
    } catch { setMsg({ ok: false, text: 'Network error' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDeposits(filter) }, [filter])

  async function act(id: string, action: 'approve' | 'reject') {
    let reason: string | undefined
    if (action === 'reject') {
      reason = prompt('Rejection reason (shown to the user):') || undefined
      if (reason === undefined) return
    }
    if (action === 'approve' && !confirm('Approve this deposit and credit the wallet?')) return
    setBusy(id); setMsg(null)
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMsg({ ok: true, text: action === 'approve' ? `Approved — wallet credited (${Number(data.new_balance).toFixed(2)} DZD new balance)` : 'Rejected' })
      fetchDeposits()
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' }) }
    finally { setBusy(null) }
  }

  const pendingCount = deposits.filter(d => d.status === 'pending').length

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Deposits {filter === 'pending' && pendingCount > 0 && <span className="text-amber-400">({pendingCount} pending)</span>}</h1>
          <div className="flex gap-2">
            <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>Pending</Button>
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
          </div>
        </div>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-4">
            <AdminMobileNav />
            {msg && <div className={`rounded-xl p-3 border text-sm ${msg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>}
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400">
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Proof</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" /></td></tr>
                    ) : deposits.length === 0 ? (
                      <tr><td colSpan={7} className="p-10 text-center text-zinc-500">No deposit requests {filter === 'pending' ? 'pending' : 'yet'}.</td></tr>
                    ) : deposits.map(d => (
                      <tr key={d.id} className="hover:bg-zinc-900/30 align-top">
                        <td className="p-3">
                          <div className="font-medium text-white">{d.user?.full_name || '—'}</div>
                          <div className="text-xs text-zinc-500">{d.user?.email}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">{Number(d.amount).toFixed(2)} <span className="text-xs text-zinc-500">{d.currency}</span></td>
                        <td className="p-3">
                          <div className="text-white">{d.payment_method}</div>
                          {d.reference_number && <div className="text-xs text-zinc-500 font-mono">Ref: {d.reference_number}</div>}
                          {d.notes && <div className="text-xs text-zinc-600 mt-1 max-w-[180px]">{d.notes}</div>}
                        </td>
                        <td className="p-3">
                          {d.screenshot_url ? (
                            <a href={d.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-block relative group">
                              <img src={d.screenshot_url} alt="proof" className="h-16 w-16 object-cover rounded-lg border border-zinc-700" />
                              <ExternalLink className="h-4 w-4 absolute -top-1.5 -right-1.5 text-violet-400 bg-zinc-900 rounded-full p-0.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-600 flex items-center gap-1"><ImageIcon className="h-3 w-3" /> none</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-zinc-500">{new Date(d.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'destructive' : 'warning'}>{d.status}</Badge>
                          {d.rejection_reason && <div className="text-xs text-red-400 mt-1 max-w-[140px]">{d.rejection_reason}</div>}
                        </td>
                        <td className="p-3 text-right">
                          {d.status === 'pending' ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" onClick={() => act(d.id, 'approve')} disabled={busy === d.id} className="bg-emerald-600 hover:bg-emerald-700">
                                {busy === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => act(d.id, 'reject')} disabled={busy === d.id}>
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          ) : <span className="text-xs text-zinc-600">processed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-zinc-600">Approving a deposit instantly credits the user wallet and sends an in-app notification. Click the proof thumbnail to view it full size.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}