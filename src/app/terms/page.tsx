import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent } from '@/app/components/ui/ui'

export const runtime = 'edge'

export default function TermsPage(){
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-zinc-500 text-sm mt-1">Last updated: August 2026</p>
        <Card className="mt-6"><CardContent className="p-8 text-sm leading-relaxed text-zinc-300 space-y-4">
          <p>Welcome to DigitalStore. By using our service you agree to these terms.</p>
          <h3 className="font-bold text-white">1. Wallet Payments</h3><p>All purchases are paid from your internal wallet balance. Deposits require admin approval. No external card gateway (Stripe/PayPal) is used.</p>
          <h3 className="font-bold text-white">2. Digital Delivery</h3><p>Automatic products are delivered instantly after payment. Manual products within 24 hours.</p>
          <h3 className="font-bold text-white">3. Refunds</h3><p>Refunds are at admin discretion and credited to wallet. Revealed digital keys may be non-refundable per product terms.</p>
          <h3 className="font-bold text-white">4. Subscriptions</h3><p>Subscriptions expire on the stated date. Renewal extends expiration atomically.</p>
          <h3 className="font-bold text-white">5. Prohibited Use</h3><p>Fraud, unauthorized reselling, or abuse may result in suspension and audit logging.</p>
        </CardContent></Card>
      </div>
      <Footer />
    </div>
  )
}