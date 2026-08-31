import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/ui'



export default function FAQPage(){
  const faqs = [
    { q:'How does the wallet system work?', a:'You top up your wallet via a deposit request (CCP, BaridiMob, Bank Transfer, Crypto). An admin approves it and your balance is credited. You then purchase products instantly with your balance — no card needed at checkout.' },
    { q:'How fast is delivery?', a:'Automatic products are delivered instantly after successful payment. Manual products are delivered within 24 hours by our team.' },
    { q:'What if stock runs out?', a:'We maintain real inventory. If no available credentials exist, the purchase will be blocked and you will not be charged.' },
    { q:'Can I get a refund?', a:'Refunds are issued by admins and credited back to your wallet. Contact support with your order number.' },
    { q:'How do subscriptions work?', a:'Subscriptions have an expiration date. You can view all subscriptions in your account and renew before expiry using your wallet.' },
    { q:'Is my data safe?', a:'Credentials are stored securely and only visible to you and authorized admins. We use Row Level Security and server-side verification.' },
    { q:'What payment methods for deposits?', a:'CCP, BaridiMob, Bank Transfer, Cryptocurrency, and Manual Payment. Admins can configure methods.' },
    { q:'Can I use coupons?', a:'Yes! Enter a coupon code at checkout. Percentage or fixed discounts with configurable limits.' },
  ]
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white">Frequently Asked Questions</h1>
        <p className="text-zinc-400 mt-2">Everything you need to know about DigitalStore.</p>
        <div className="mt-8 grid gap-4">
          {faqs.map(f=>(
            <Card key={f.q}><CardContent className="p-5"><h3 className="font-semibold text-white">{f.q}</h3><p className="text-sm text-zinc-400 mt-2 leading-relaxed">{f.a}</p></CardContent></Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}