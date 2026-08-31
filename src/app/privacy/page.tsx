import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent } from '@/app/components/ui/ui'


export default function PrivacyPage(){
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mt-1">Last updated: August 2026</p>
        <Card className="mt-6"><CardContent className="p-8 text-sm leading-relaxed text-zinc-300 space-y-4">
          <p>Your privacy is important to us.</p>
          <h3 className="font-bold text-white">Data We Collect</h3><p>Email, profile, wallet transactions, orders, deposit references. No card data is stored.</p>
          <h3 className="font-bold text-white">Usage</h3><p>To fulfill orders, manage wallet, prevent fraud, and improve service. We do not sell data.</p>
          <h3 className="font-bold text-white">Security</h3><p>Row Level Security, server-side verification, hashed passwords via Supabase Auth, audit logs, and encrypted credentials.</p>
          <h3 className="font-bold text-white">Retention</h3><p>Transaction records are immutable for audit. You may request account deletion.</p>
        </CardContent></Card>
      </div>
      <Footer />
    </div>
  )
}