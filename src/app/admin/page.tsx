import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/app/components/ui/ui'
import { getAdminStats } from '@/lib/actions/extra'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'edge'


export default async function AdminDashboard(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminDb = getServerSupabase()
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes((profile as {role:string}).role)) redirect('/')

  let stats: Record<string,unknown> = {}
  try { const r = await getAdminStats(); if(r.success) stats=r.data } catch {}
  const s = stats as { totalSales:number; todaysSales:number; monthlySales:number; totalUsers:number; pendingDeposits:number; availableInventory:number; activeSubscriptions:number; totalOrders:number; pendingOrders:number }

  const cards = [
    { label:'Total Sales', value: `${Number(s?.totalSales||0).toFixed(2)} DZD`, sub:'All time' },
    { label:"Today's Sales", value: `${Number(s?.todaysSales||0).toFixed(2)} DZD`, sub:'Today' },
    { label:'Monthly Sales', value: `${Number(s?.monthlySales||0).toFixed(2)} DZD`, sub:'This month' },
    { label:'Total Users', value: String(s?.totalUsers||0), sub:'Registered' },
    { label:'Active Subscriptions', value: String(s?.activeSubscriptions||0), sub:'Active' },
    { label:'Pending Deposits', value: String(s?.pendingDeposits||0), sub:'Need approval' },
    { label:'Pending Orders', value: String(s?.pendingOrders||0), sub:'Processing' },
    { label:'Available Inventory', value: String(s?.availableInventory||0), sub:'In stock' },
  ]

  // Live recent activity
  const [{ data: recentOrders }, { data: recentDeposits }, { data: recentLogs }] = await Promise.all([
    adminDb.from('orders').select('id, order_number, total, status, delivery_status, created_at, user:profiles!orders_user_id_fkey(email)').order('created_at', { ascending:false }).limit(5),
    adminDb.from('deposit_requests').select('id, amount, status, created_at, user:profiles!deposit_requests_user_id_fkey(email)').order('created_at', { ascending:false }).limit(5),
    adminDb.from('admin_logs').select('id, action, entity_type, created_at, admin:profiles!admin_logs_admin_id_fkey(email)').order('created_at', { ascending:false }).limit(6),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-6">
            <AdminMobileNav />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map(c=>(
                <Card key={c.label}><CardContent className="p-5"><div className="text-xs text-zinc-500">{c.label}</div><div className="text-xl font-black text-white mt-1">{c.value}</div><div className="text-xs text-zinc-600">{c.sub}</div></CardContent></Card>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <Link href="/admin/products" className="rounded-xl bg-violet-600 text-white p-4 text-center font-medium">+ New Product</Link>
                  <Link href="/admin/deposits" className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center text-zinc-300">Review Deposits {s?.pendingDeposits ? `(${s.pendingDeposits})` : ''}</Link>
                  <Link href="/admin/orders" className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center text-zinc-300">Manage Orders {s?.pendingOrders ? `(${s.pendingOrders})` : ''}</Link>
                  <Link href="/admin/inventory" className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center text-zinc-300">Inventory ({s?.availableInventory ?? 0})</Link>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-zinc-400 mb-1">Latest Orders</div>
                    {(!recentOrders || recentOrders.length===0) ? <p className="text-xs text-zinc-600">No orders yet.</p> : (
                      <div className="space-y-1">
                        {(recentOrders as any[]).map((o:any)=>(
                          <div key={o.id} className="flex justify-between text-xs">
                            <span className="font-mono text-violet-400">{o.order_number}</span>
                            <span className="text-zinc-500">{o.user?.email?.split('@')[0] || '—'}</span>
                            <Badge variant={o.status==='completed'?'success':o.status==='pending'?'warning':'secondary'} className="text-[10px]">{o.status}</Badge>
                            <span className="font-mono text-zinc-300">{Number(o.total).toFixed(0)} DZD</span>
                          </div>
                        ))}
                        <Link href="/admin/orders" className="text-xs text-violet-400 hover:underline">View all →</Link>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 mb-1">Latest Deposits</div>
                    {(!recentDeposits || recentDeposits.length===0) ? <p className="text-xs text-zinc-600">No deposits yet.</p> : (
                      <div className="space-y-1">
                        {(recentDeposits as any[]).map((d:any)=>(
                          <div key={d.id} className="flex justify-between text-xs">
                            <span className="text-zinc-300">{Number(d.amount).toFixed(0)} DZD</span>
                            <span className="text-zinc-500">{d.user?.email?.split('@')[0] || '—'}</span>
                            <Badge variant={d.status==='approved'?'success':d.status==='pending'?'warning':'destructive'} className="text-[10px]">{d.status}</Badge>
                          </div>
                        ))}
                        <Link href="/admin/deposits" className="text-xs text-violet-400 hover:underline">Review →</Link>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-400 mb-1">Audit Trail</div>
                    {(!recentLogs || recentLogs.length===0) ? <p className="text-xs text-zinc-600">No logs yet.</p> : (
                      <div className="space-y-1">
                        {(recentLogs as any[]).slice(0,4).map((l:any)=>(
                          <div key={l.id} className="text-xs text-zinc-500 flex justify-between">
                            <span><span className="text-zinc-300">{l.action}</span> <span className="text-zinc-600">· {l.entity_type}</span></span>
                            <span className="text-[11px]">{new Date(l.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                        <Link href="/admin/logs" className="text-xs text-violet-400 hover:underline">Open logs →</Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Security Notes</CardTitle></CardHeader>
              <CardContent className="text-sm text-zinc-400 leading-relaxed">
                • Wallet operations are server-side and atomic • No client price/balance trust • RLS enabled • Audit logs track admin actions • Service role key never exposed to client.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}