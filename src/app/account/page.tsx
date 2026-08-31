import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/ui'
import { Wallet, Package, Tv, Heart, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'edge'


export default async function AccountPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile as {role:string}|null)?.role || 'customer'
  const { data: wallet } = await supabase.from('wallets').select('balance,currency').eq('user_id', user.id).single()
  const w = wallet as {balance:number;currency:string}|null
  const { count: orderCount } = await supabase.from('orders').select('id', {count:'exact', head:true}).eq('user_id', user.id)
  const { count: subCount } = await supabase.from('subscriptions').select('id', {count:'exact', head:true}).eq('user_id', user.id).eq('status','active')
  const { data: recentOrders } = await supabase.from('orders').select('id,order_number,total,status,created_at').eq('user_id', user.id).order('created_at',{ascending:false}).limit(3)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={{ id: user.id, email: user.email!, role }} balance={Number(w?.balance ?? 0)} currency={w?.currency || 'DZD'} />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">My Account</h1>
        <AccountLayout>
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardContent className="p-6 text-center"><Wallet className="h-8 w-8 mx-auto text-violet-400 mb-2"/><div className="text-2xl font-black text-white">{Number(w?.balance||0).toFixed(2)} {w?.currency||'DZD'}</div><div className="text-xs text-zinc-500">Wallet Balance</div></CardContent></Card>
              <Card><CardContent className="p-6 text-center"><Package className="h-8 w-8 mx-auto text-emerald-400 mb-2"/><div className="text-2xl font-black text-white">{orderCount||0}</div><div className="text-xs text-zinc-500">Total Orders</div></CardContent></Card>
              <Card><CardContent className="p-6 text-center"><Tv className="h-8 w-8 mx-auto text-amber-400 mb-2"/><div className="text-2xl font-black text-white">{subCount||0}</div><div className="text-xs text-zinc-500">Active Subscriptions</div></CardContent></Card>
              <Card><CardContent className="p-6 text-center"><Heart className="h-8 w-8 mx-auto text-pink-400 mb-2"/><div className="text-xs text-zinc-500 mt-4">Welcome, {user.email}</div></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
              <CardContent>
                {!recentOrders?.length ? <p className="text-sm text-zinc-500">No orders yet. <Link href="/shop" className="text-violet-400">Start shopping</Link></p> : (
                  <div className="space-y-3">
                    {(recentOrders as {id:string;order_number:string;total:number;status:string;created_at:string}[]).map(o=>(
                      <Link key={o.id} href={`/account/orders/${o.id}`} className="flex justify-between items-center rounded-xl border border-zinc-800 bg-zinc-950 p-3 hover:border-zinc-700">
                        <div><div className="font-medium text-white text-sm">{o.order_number}</div><div className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleDateString()} • {o.status}</div></div>
                        <div className="font-bold text-white">{Number(o.total).toFixed(2)}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/account/wallet" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-violet-600/50">
                <Wallet className="h-6 w-6 text-violet-400 mb-2"/><div className="font-semibold text-white">Wallet</div><div className="text-xs text-zinc-500">Top up & manage balance</div>
              </Link>
              <Link href="/account/subscriptions" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-violet-600/50">
                <Tv className="h-6 w-6 text-amber-400 mb-2"/><div className="font-semibold text-white">Subscriptions</div><div className="text-xs text-zinc-500">View & renew</div>
              </Link>
              <Link href="/account/orders" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-violet-600/50">
                <Package className="h-6 w-6 text-emerald-400 mb-2"/><div className="font-semibold text-white">Orders</div><div className="text-xs text-zinc-500">History & delivery</div>
              </Link>
            </div>
          </div>
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}