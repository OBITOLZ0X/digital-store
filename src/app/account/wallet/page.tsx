import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Select, Textarea } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'edge'


export default async function WalletPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll(c: unknown) {} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: wallet } = await supabase.from('wallets').select('balance,currency,is_frozen').eq('user_id', user.id).single()
  const w = wallet as { balance: number; currency: string; is_frozen: boolean } | null
  const { data: deposits } = await supabase.from('deposit_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
  const { data: methods } = await supabase.from('deposit_methods').select('*').eq('is_active', true).order('sort_order')
  const topupAmount = params.amount ? Number(params.amount) : null

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Wallet</h1>
        <AccountLayout>
          <div className="space-y-6">
            {params.success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">✅ Deposit request submitted! The admin will review your proof and credit your balance.</div>
            )}
            {topupAmount && !params.success && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">⚠️ You need at least <b>{topupAmount.toFixed(2)} DZD</b> to complete your purchase. Send money via one of the methods below, then submit the proof here — the admin will credit your wallet after verification.</div>
            )}
            <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 border-0 text-white">
              <CardContent className="p-8">
                <div className="text-sm opacity-80">Current Balance</div>
                <div className="text-4xl font-black mt-1">{Number(w?.balance || 0).toFixed(2)} <span className="text-lg font-normal opacity-80">{w?.currency || 'DZD'}</span></div>
                {w?.is_frozen && <div className="mt-3 text-sm bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-2">⚠️ Wallet is frozen. Contact support.</div>}
                <div className="text-xs opacity-60 mt-3">Secure internal wallet • Admin-verified deposits</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add Balance — Send Payment Proof</CardTitle><CardDescription>1) Send money via a method below. 2) Fill this form with the amount + proof (screenshot image and/or transaction code). 3) Admin approves → balance credited.</CardDescription></CardHeader>
              <CardContent>
                <form action="/api/wallet/deposit" method="post" encType="multipart/form-data" className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Amount (DZD) *</Label><Input name="amount" type="number" step="0.01" min="1" defaultValue={topupAmount ?? undefined} placeholder="1000" required className="mt-1.5" /></div>
                    <div><Label>Payment Method *</Label>
                      <Select name="payment_method" required className="mt-1.5">
                        <option value="">Select method</option>
                        {(methods as { code: string; name: string }[] | null)?.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                        {!methods?.length && ['ccp', 'baridimob', 'bank_transfer', 'crypto', 'manual'].map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div><Label>Transaction / Reference Code</Label><Input name="reference_number" placeholder="e.g. TX-123456 (or the transfer code from BaridiMob/CCP)" className="mt-1.5" /></div>
                  <div>
                    <Label>Proof of Payment — Screenshot / Photo *</Label>
                    <Input name="proof_image" type="file" accept="image/png,image/jpeg,image/webp" className="mt-1.5" />
                    <p className="text-xs text-zinc-500 mt-1">Upload the screenshot of the transfer or a photo of the receipt. PNG/JPEG/WebP max 5MB. (Required unless you provide a reference code.)</p>
                  </div>
                  <div><Label>Notes (optional)</Label><Textarea name="notes" placeholder="Any additional info..." rows={2} className="mt-1.5" /></div>
                  <Button type="submit" className="w-full h-11">Submit Deposit Proof</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Deposit Requests</CardTitle></CardHeader>
              <CardContent>
                {!deposits?.length ? <p className="text-sm text-zinc-500">No deposit requests yet.</p> : (
                  <div className="space-y-3">
                    {(deposits as { id: string; amount: number; payment_method: string; status: string; created_at: string; rejection_reason: string | null; screenshot_url: string | null }[]).map(d => (
                      <div key={d.id} className="flex justify-between items-center rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                        <div>
                          <div className="font-medium text-white text-sm">{Number(d.amount).toFixed(2)} DZD • {d.payment_method}</div>
                          <div className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleString()} {d.screenshot_url ? '• 📎 proof attached' : ''}</div>
                          {d.rejection_reason && <div className="text-xs text-red-400">Reason: {d.rejection_reason}</div>}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${d.status === 'approved' ? 'bg-emerald-500 text-white' : d.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}