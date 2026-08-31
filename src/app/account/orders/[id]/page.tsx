import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DeliveryCredentials } from './delivery-credentials'

export const runtime = 'edge'


export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { getServerSupabase } = await import('@/lib/supabase/server-client')
  const adminDb = getServerSupabase()
  const { data: order } = await adminDb.from('orders').select('*, items:order_items(*)').eq('id', id).eq('user_id', user.id).single()
  // inventory_items.order_id has no FK — fetch separately
  const { data: inv } = await adminDb.from('inventory_items').select('product_data').eq('order_id', id)
  const o = order ? { ...(order as any), inventory: inv || [] } as { id:string; order_number:string; total:number; status:string; delivery_status:string; created_at:string; items:{product_name:string;variant_name:string|null;quantity:number;unit_price:number}[]; inventory?:{product_data:Record<string,string>}[] } : null
  if (!o) return <div className="min-h-screen flex items-center justify-center text-zinc-500">Order not found</div>
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Order {o.order_number}</h1>
        <AccountLayout>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Status</span><Badge variant={o.status==='completed'?'success':'secondary'}>{o.status}</Badge></div>
                <div className="flex justify-between"><span className="text-zinc-500">Delivery</span><span className="text-white">{o.delivery_status}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Date</span><span className="text-white">{new Date(o.created_at).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-white border-t border-zinc-800 pt-3"><span>Total</span><span className="text-violet-400">{Number(o.total).toFixed(2)} DZD</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Items</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {o.items.map((it,i)=>(
                  <div key={i} className="flex justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <div><div className="font-medium text-white text-sm">{it.product_name}</div><div className="text-xs text-zinc-500">{it.variant_name || ''} • ×{it.quantity} @ {Number(it.unit_price).toFixed(2)} DZD</div></div>
                  </div>
                ))}
              </CardContent>
            </Card>
            {o.inventory?.length ? (
              <Card className="border-emerald-600/30">
                <CardHeader><CardTitle className="text-emerald-400">Delivery — Credentials</CardTitle></CardHeader>
                <CardContent>
                  <DeliveryCredentials inventory={o.inventory} />
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="p-6 text-sm text-zinc-500">Credentials will appear here after delivery. For manual products, please wait for admin processing.</CardContent></Card>
            )}
          </div>
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}