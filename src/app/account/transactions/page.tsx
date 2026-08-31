import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'edge'


export default async function TransactionsPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).limit(50)
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Transactions</h1>
        <AccountLayout>
          <Card>
            <CardHeader><CardTitle>Wallet History</CardTitle></CardHeader>
            <CardContent>
              {!txs?.length ? <p className="text-sm text-zinc-500">No transactions yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-zinc-500 border-b border-zinc-800"><tr><th className="text-left py-2">Date</th><th className="text-left">Type</th><th className="text-right">Amount</th><th className="text-right">Balance</th><th className="text-left">Ref</th></tr></thead>
                    <tbody>
                      {(txs as {id:string;type:string;amount:number;balance_before:number;balance_after:number;reference:string|null;created_at:string}[]).map(t=>(
                        <tr key={t.id} className="border-b border-zinc-800/50">
                          <td className="py-3 text-zinc-400">{new Date(t.created_at).toLocaleString()}</td>
                          <td><span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.type==='deposit' || t.type==='refund' || t.type==='admin_credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.type}</span></td>
                          <td className={`text-right font-mono ${t.type==='deposit' || t.type==='refund'?'text-emerald-400':'text-white'}`}>{t.type==='purchase' || t.type==='admin_debit' ? '-' : '+'}{Number(t.amount).toFixed(2)}</td>
                          <td className="text-right font-mono text-zinc-400">{Number(t.balance_after).toFixed(2)}</td>
                          <td className="text-zinc-500 text-xs truncate max-w-[120px]">{t.reference || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}