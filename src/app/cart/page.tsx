import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent } from '@/app/components/ui/ui'

export const runtime = 'edge'


export default function CartPage(){
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white">Cart</h1>
        <p className="text-zinc-400 mt-2">Cart is available as a quick-buy flow. Go to any product and click “Buy” to purchase with your wallet instantly.</p>
        <Card className="mt-8"><CardContent className="p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-zinc-400">Your cart is empty — but you can buy directly from any product page with one click using your wallet.</p>
          <a href="/shop" className="inline-block mt-6 px-6 py-3 rounded-xl bg-violet-600 text-white font-medium">Browse Products</a>
        </CardContent></Card>
      </div>
      <Footer />
    </div>
  )
}