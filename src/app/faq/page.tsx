import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent } from '@/app/components/ui/ui'
import { getContactChannels } from '@/lib/queries'
import { contactHref } from '@/lib/store'
import { MessageCircle, HelpCircle, Clock, ShieldCheck, RefreshCw, Send } from 'lucide-react'
import { getLang } from '@/lib/i18n/server'
import { t } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default async function FaqPage(){
  const lang = await getLang()
  const contacts = await getContactChannels()
  const T = (k: string) => t(lang, k)
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3"><HelpCircle className="h-7 w-7 text-[#22d3ee]" /> {T('faq.title')}</h1>
        <p className="text-zinc-500 mb-8">{T('faq.subtitle')}</p>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#22d3ee]" /> {T('faq.q1')}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{T('faq.a1')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-400" /> {T('faq.q2')}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{T('faq.a2')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-amber-400" /> {T('faq.q3')}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{T('faq.a3')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#22d3ee]" /> {T('faq.q4')}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{T('faq.a4')}</p>
            </CardContent>
          </Card>
        </div>

        {contacts.length > 0 && (
          <div className="mt-10 rounded-3xl border border-[#22d3ee]/25 bg-[#22d3ee]/[0.04] p-6">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><Send className="h-4 w-4 text-[#22d3ee]" /> {T('faq.reachUs')}</h2>
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
      <Footer lang={lang} />
    </div>
  )
}
