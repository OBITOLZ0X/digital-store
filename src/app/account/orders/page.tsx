import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'



export default async function OrdersPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Use service role to bypass RLS recursion bug (profiles → is_admin recursion)
  const { getServerSupabase } = await import('@/lib/supabase/server-client')
  const adminDb = getServerSupabase()
  const { data: orders } = await adminDb.from('orders').select('*, items:order_items(*)').eq('user_id', user.id).order('created_at',{ascending:false})
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>
        <AccountLayout>
          {!orders?.length ? <Card><CardContent className="p-12 text-center text-zinc-500">No orders yet. <Link href="/shop" className="text-violet-400">Browse products</Link></CardContent></Card> : (
            <div className="space-y-4">
              {(orders as {id:string;order_number:string;total:number;status:string;delivery_status:string;created_at:string;items:{product_name:string;variant_name:string|null;quantity:number;unit_price:number}[]}[]).map(o=>(
                <Card key={o.id}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/account/orders/${o.id}`} className="font-bold text-white hover:text-violet-400">{o.order_number}</Link>
                        <div className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleString()} • {o.delivery_status}</div>
                        <div className="text-sm text-zinc-400 mt-2">{o.items.map(i=>`${i.product_name}${i.variant_name?` (${i.variant_name})`:''} ×${i.quantity}`).join(', ')}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-white">{Number(o.total).toFixed(2)} DZD</div>
                        <Badge variant={o.status==='completed'?'success': o.status==='refunded'?'destructive':'secondary'} className="mt-1">{o.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}