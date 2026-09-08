'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, TrendingUp, Package, Contact, Loader2, BarChart3 } from 'lucide-react'

interface VisitData {
  totals: {
    totalViews: number
    todayViews: number
    products: number
    categories: number
    contacts: number
    days: { day: string; views: number }[]
  }
  products: { id: string; slug: string; name: string; views: number; last7: number[] }[]
}

export function DashboardClient() {
  const [data, setData] = useState<VisitData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/admin/visits').then(r => r.json()).then(d => { if (!d.error) setData(d) }).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>
  if (!data) return <p className="text-zinc-500 py-12 text-center">Failed to load stats.</p>

  const maxDay = Math.max(1, ...data.totals.days.map(d => d.views))

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Total product views" value={format(data.totals.totalViews)} sub="All time" />
        <StatCard icon={TrendingUp} label="Views today" value={format(data.totals.todayViews)} sub="Since midnight UTC" />
        <StatCard icon={Package} label="Products" value={String(data.totals.products)} sub={`${data.totals.categories} categories`} />
        <StatCard icon={Contact} label="Contact channels" value={String(data.totals.contacts)} sub="WhatsApp, Telegram, …" />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4"><BarChart3 className="h-4 w-4 text-violet-400" /> Views — last 14 days</h2>
        <div className="flex items-end gap-1.5 h-36">
          {data.totals.days.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full rounded-t-md bg-gradient-to-t from-violet-700 to-violet-500 group-hover:from-violet-600 group-hover:to-violet-400 transition relative" style={{ height: `${Math.max(4, (d.views / maxDay) * 100)}%` }}>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-300 bg-zinc-800 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">{d.views} views</span>
              </div>
              <span className="text-[9px] text-zinc-600">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="p-5 pb-3"><h2 className="font-semibold text-white flex items-center gap-2"><Eye className="h-4 w-4 text-violet-400" /> Most visited products</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 border-b border-zinc-800 bg-zinc-900/60">
              <tr>
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-right p-3 font-medium">Total views</th>
                <th className="text-left p-3 font-medium w-1/2">Last 7 days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {data.products.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No products yet. Add your first product from the <Link href="/admin/products/new" className="text-violet-400 hover:text-violet-300">Products</Link> section.</td></tr>}
              {data.products.map((p, i) => (
                <tr key={p.id} className="hover:bg-zinc-800/30">
                  <td className="p-3 text-zinc-500">{i + 1}</td>
                  <td className="p-3">
                    <Link href={`/products/${p.slug}`} target="_blank" className="text-white hover:text-violet-400 transition">{p.name}</Link>
                    <div className="text-[11px] text-zinc-600">/products/{p.slug}</div>
                  </td>
                  <td className="p-3 text-right font-bold text-white">{format(p.views)}</td>
                  <td className="p-3">
                    <div className="flex items-end gap-1 h-8">
                      {p.last7.map((v, j) => (
                        <div key={j} className="flex-1 rounded-sm bg-violet-600/70" style={{ height: `${Math.max(6, (v / Math.max(1, ...p.last7)) * 100)}%` }} title={`${v} views`} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Eye; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 text-xs text-zinc-500"><Icon className="h-3.5 w-3.5 text-violet-400" /> {label}</div>
      <div className="text-2xl font-black text-white mt-1.5">{value}</div>
      <div className="text-[11px] text-zinc-600 mt-0.5">{sub}</div>
    </div>
  )
}

function format(n: number) { return new Intl.NumberFormat('en-US').format(n) }
