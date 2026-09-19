import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { getContactChannels } from '@/lib/queries'
import { contactHref } from '@/lib/store'
import { MessageCircle, Send, Mail, AtSign, Share2, Globe, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, typeof MessageCircle> = { whatsapp: MessageCircle, telegram: Send, email: Mail, instagram: AtSign, facebook: Share2, custom: Globe }

export default async function ContactPage(){
  const contacts = await getContactChannels()
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white">Contact Us</h1>
        <p className="text-zinc-400 mt-2 mb-8">Reach us on any channel below — we usually reply within a few minutes. To order, tell us the product and period you want.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {contacts.map(c => {
            const Icon = ICONS[c.type] || Globe
            const url = c.url || contactHref(c.type, c.value)
            return (
              <div key={c.id} className="rounded-2xl border border-white/5 bg-[#111] p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: (c.color||'#7c3aed')+'22', color: c.color||'#a78bfa' }}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{c.label}</div>
                  <div className="text-sm text-zinc-500 truncate">{url.replace(/^https?:\/\//,'').replace(/^mailto:/,'')}</div>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl px-3 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: c.color || '#7c3aed' }}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )
          })}
        </div>
        {contacts.length === 0 && <p className="text-zinc-500">Contact channels will appear here once configured.</p>}
      </div>
      <Footer />
    </div>
  )
}
