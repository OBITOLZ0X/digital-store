import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: sub } = await supabase.from('subscriptions').select('*, product:products(*), variant:product_variants(*), inventory:inventory_items(product_data)').eq('id', id).eq('user_id', user.id).single()
  const s = sub as { id:string; status:string; start_date:string; expiration_date:string; product:{name:string; product_type:string; instructions:string|null}; variant:{name:string;duration_days:number}|null; inventory:{product_data:Record<string,string>}|null } | null
  if (!s) return <div className="min-h-screen flex items-center justify-center text-zinc-500">Not found</div>
  const daysLeft = Math.ceil((new Date(s.expiration_date).getTime() - Date.now())/(1000*60*60*24))
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">{s.product.name} — {s.variant?.name}</h1>
        <AccountLayout>
          <div className="space-y-6">
            <Card><CardContent className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><Badge variant={s.status==='active'?'success':'secondary'}>{s.status}</Badge></div>
              <div className="flex justify-between"><span className="text-zinc-500">Start</span><span className="text-white">{new Date(s.start_date).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Expires</span><span className="text-white">{new Date(s.expiration_date).toLocaleDateString()} ({daysLeft>0?`${daysLeft} days left`:'expired'})</span></div>
            </CardContent></Card>
            {s.inventory?.product_data && (
              <Card className="border-violet-600/30">
                <CardHeader><CardTitle>Credentials</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(s.inventory.product_data).filter(([k])=>k!=='delivered_by').map(([k,v])=>(
                    <div key={k} className="flex justify-between items-center rounded-xl bg-zinc-950 border border-zinc-800 p-3">
                      <span className="text-sm text-zinc-500">{k}</span>
                      <span className="font-mono text-sm text-white flex items-center gap-2">{String(v)} <button onClick={()=>navigator.clipboard.writeText(String(v))} className="text-xs text-violet-400">Copy</button></span>
                    </div>
                  ))}
                  {s.product.instructions && <p className="text-xs text-zinc-500 mt-2">{s.product.instructions}</p>}
                </CardContent>
              </Card>
            )}
            {s.product.product_type==='iptv' && s.inventory?.product_data && (
              <Card>
                <CardHeader><CardTitle>IPTV Details</CardTitle></CardHeader>
                <CardContent className="text-sm text-zinc-300 space-y-1">
                  <p>M3U URL: <code className="bg-zinc-900 px-2 py-1 rounded text-violet-400 break-all">{(s.inventory.product_data as Record<string,string>).m3u_url || '—'}</code></p>
                  <p>Server: {(s.inventory.product_data as Record<string,string>).server_url || '—'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}
