import Link from 'next/link'

export function TermsPage(){
  return (
    <Legal title="Terms of Service">
      <p>Last updated: September 2026</p>
      <h3>1. Orders</h3>
      <p>All orders are placed through our contact channels (WhatsApp, Telegram, etc.). By messaging us about a product you agree to these terms.</p>
      <h3>2. Payment</h3>
      <p>Payment is arranged directly in the chat before delivery. Prices are listed on each product page per period.</p>
      <h3>3. Delivery</h3>
      <p>Products are delivered through the same chat channel used for ordering, after payment confirmation.</p>
      <h3>4. Refunds</h3>
      <p>Refunds are handled case by case in the chat. Digital items already delivered may be non-refundable.</p>
      <h3>5. Prohibited Use</h3>
      <p>Fraud, chargeback abuse, or reselling credentials without authorization may result in refusal of service.</p>
    </Legal>
  )
}

export function PrivacyPage(){
  return (
    <Legal title="Privacy Policy">
      <p>Last updated: September 2026</p>
      <h3>Data We Collect</h3>
      <p>We do not require accounts. We only see what you send us in chat (your name and messages) and anonymous page-visit counts used to know which products are popular.</p>
      <h3>How We Use Data</h3>
      <p>To process your order and improve the catalog. We do not sell data.</p>
      <h3>Analytics</h3>
      <p>Product pages count anonymous views (no profiles, no tracking cookies, no ads).</p>
    </Legal>
  )
}

function Legal({ title, children }:{ title:string; children:React.ReactNode }){
  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-12 text-sm text-zinc-400 leading-relaxed [&_h3]:text-white [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-3 [&_a]:text-[#22d3ee]">
      <Link href="/" className="text-[#22d3ee] hover:text-[#22d3ee] text-sm">← Back to store</Link>
      <h1 className="text-3xl font-black text-white mt-4 mb-4">{title}</h1>
      {children}
    </div>
  )
}
