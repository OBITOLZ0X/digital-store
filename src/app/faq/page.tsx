import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent } from '@/app/components/ui/ui'
import { getContactChannels } from '@/lib/queries'
import { contactHref } from '@/lib/store'
import { MessageCircle, HelpCircle, Clock, ShieldCheck, RefreshCw, Send } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FaqPage(){
  const contacts = await getContactChannels()
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><HelpCircle className="h-7 w-7 text-[#22d3ee]" /> Frequently Asked Questions</h1>
        <p className="text-zinc-500 mb-8">Everything about ordering — no account needed.</p>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#22d3ee]" /> How do I buy a product?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Open the product page, choose the period/plan you want, then tap one of the contact buttons (WhatsApp, Telegram, …). Message us with the product name and period — we confirm your order and arrange payment directly in the chat. No registration, no balance, no checkout.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-400" /> How fast do you reply?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">We usually reply within minutes during the day. You&apos;ll always see current response behavior once we start chatting.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-amber-400" /> Do you have the plan I want?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Every product page lists all available periods and their prices. If you need something custom, just message us — we often accommodate.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#22d3ee]" /> Is it safe to order this way?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Yes. You talk directly with us, payment is confirmed in the chat before anything is delivered, and everything you order is documented in the conversation.</p>
            </CardContent>
          </Card>
        </div>

        {contacts.length > 0 && (
          <div className="mt-10 rounded-3xl border border-[#22d3ee]/25 bg-[#22d3ee]/[0.04] p-6">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><Send className="h-4 w-4 text-[#22d3ee]" /> Reach us directly</h2>
            <ul className="flex flex-wrap gap-3">
              {contacts.map(c => (
                <li key={c.id}>
                  <a href={c.url || contactHref(c.type, c.value)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition" style={{ backgroundColor: c.color || '#7c3aed' }}>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
