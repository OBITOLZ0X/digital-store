import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'edge'


export default async function SubscriptionsPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: subs } = await supabase.from('subscriptions').select('*, product:products(name, product_type), variant:product_variants(name, price), inventory:inventory_items(product_data)').eq('user_id', user.id).order('expiration_date',{ascending:true})
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Subscriptions</h1>
        <AccountLayout>
          {!subs?.length ? <Card><CardContent className="p-12 text-center text-zinc-500">No subscriptions yet. <Link href="/shop" className="text-violet-400">Browse</Link></CardContent></Card> : (
            <div className="grid gap-4">
              {(subs as {id:string;status:string;expiration_date:string;start_date:string; product:{name:string;product_type:string}; variant:{name:string;price:number}|null; inventory:{product_data:Record<string,string>}|null}[]).map(s=>{
                const daysLeft = Math.ceil((new Date(s.expiration_date).getTime() - Date.now())/(1000*60*60*24))
                const expiring = daysLeft <=7 && daysLeft >=0
                return (
                  <Card key={s.id} className={expiring?'border-amber-600/30':''}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white">{s.product?.name} {s.variant? `— ${s.variant.name}`:''}</div>
                          <div className="text-xs text-zinc-500 mt-1">Expires: {new Date(s.expiration_date).toLocaleDateString()} • {daysLeft>0? `${daysLeft} days left` : daysLeft===0?'Expires today':'Expired'}</div>
                          {s.inventory?.product_data && (
                            <div className="mt-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs space-y-1">
                              {Object.entries(s.inventory.product_data).filter(([k])=>k!=='delivered_by').slice(0,4).map(([k,v])=>(
                                <div key={k} className="flex justify-between"><span className="text-zinc-500">{k}</span><span className="text-white">{String(v)}</span></div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={s.status==='active'?'success': s.status==='expiring_soon'?'warning': s.status==='expired'?'destructive':'secondary'}>{s.status}</Badge>
                          <div><Link href={`/account/subscriptions/${s.id}`}><Button size="sm" variant="outline">View</Button></Link></div>
                          {s.status!=='expired' && s.status!=='cancelled' && <form action={`/api/subscriptions/${s.id}/renew`} method="post"><Button size="sm" className="w-full mt-1">Renew</Button></form>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}