import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent } from '@/app/components/ui/ui'

function Legal({title, children}: {title:string; children:React.ReactNode}){
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white">{title}</h1>
        <Card className="mt-6"><CardContent className="p-8 prose prose-invert max-w-none text-sm leading-relaxed text-zinc-300">{children}</CardContent></Card>
      </div>
      <Footer />
    </div>
  )
}
export function TermsPage(){ return <Legal title="Terms of Service"><p>Last updated: August 2026</p><h3>1. Wallet Payments</h3><p>All purchases use your internal wallet balance. No external card gateway is used. Deposits require admin approval.</p><h3>2. Digital Delivery</h3><p>Credentials are delivered instantly for automatic products. Manual products may take up to 24 hours.</p><h3>3. Refunds</h3><p>Refunds are at admin discretion and credited to wallet. Digital keys once revealed may be non-refundable per product terms.</p><h3>4. Subscriptions</h3><p>Subscriptions expire on the stated date. Renewal extends expiration atomically using wallet balance.</p><h3>5. Prohibited Use</h3><p>Reselling credentials without authorization, fraud, or chargeback abuse may result in account suspension.</p></Legal> }
export function PrivacyPage(){ return <Legal title="Privacy Policy"><p>Last updated: August 2026</p><h3>Data We Collect</h3><p>Email, profile info, wallet transactions, orders, and deposit references. No card data is stored.</p><h3>How We Use Data</h3><p>To fulfill orders, manage wallet, prevent fraud, and improve service. We do not sell data.</p><h3>Security</h3><p>Row Level Security, server-side verification, hashed passwords via Supabase Auth, and audit logs.</p><h3>Retention</h3><p>Transaction records are immutable and retained for audit. You may request account deletion.</p></Legal> }
