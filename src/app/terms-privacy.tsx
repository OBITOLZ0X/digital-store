import Link from 'next/link'
import { getLang } from '@/lib/i18n/server'
import { t } from '@/lib/i18n'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'

export const dynamic = 'force-dynamic'

export async function TermsPage(){
  const lang = await getLang()

  const T = (k: string) => t(lang, k)
  return (
    <>
      <Navbar />
      <Legal title={T('terms.title')} lang={lang}>
        <p>{T('terms.updated')}</p>
        <h3>{T('terms.orders')}</h3>
        <p>{T('terms.ordersText')}</p>
        <h3>{T('terms.payment')}</h3>
        <p>{T('terms.paymentText')}</p>
        <h3>{T('terms.delivery')}</h3>
        <p>{T('terms.deliveryText')}</p>
        <h3>{T('terms.refunds')}</h3>
        <p>{T('terms.refundsText')}</p>
        <h3>{T('terms.prohibited')}</h3>
        <p>{T('terms.prohibitedText')}</p>
      </Legal>
      <Footer lang={lang} />
    </>
  )
}

export async function PrivacyPage(){
  const lang = await getLang()
  const T = (k: string) => t(lang, k)
  return (
    <>
      <Navbar />
      <Legal title={T('privacy.title')} lang={lang}>
        <p>{T('privacy.updated')}</p>
        <h3>{T('privacy.collect')}</h3>
        <p>{T('privacy.collectText')}</p>
        <h3>{T('privacy.use')}</h3>
        <p>{T('privacy.useText')}</p>
        <h3>{T('privacy.analytics')}</h3>
        <p>{T('privacy.analyticsText')}</p>
      </Legal>
      <Footer lang={lang} />
    </>
  )
}

function Legal({ title, children, lang='en' }:{ title:string; children:React.ReactNode; lang?:'en'|'fr' }){
  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-12 text-sm text-zinc-400 leading-relaxed [&_h3]:text-white [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-3 [&_a]:text-[#22d3ee]">
      <Link href="/" className="text-[#22d3ee] hover:text-[#22d3ee] text-sm">← {t(lang, 'terms.back')}</Link>
      <h1 className="text-3xl font-black text-white mt-4 mb-4">{title}</h1>
      {children}
    </div>
  )
}
