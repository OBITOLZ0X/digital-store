import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent } from '@/app/components/ui/ui'
import { ProductGrid } from '@/app/components/products/product-card'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'edge'


export default async function FavoritesPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: favs } = await supabase.from('favorites').select('*, product:products(*)').eq('user_id', user.id)
  const products = (favs as {product: Record<string,unknown> & {id:string;name:string;slug:string;images:string[];price:number;compare_at_price:number|null;is_featured:boolean;product_type:string;stock:number}}[] | null)?.map(f=>f.product) || []
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Favorites</h1>
        <AccountLayout>
          {!products.length ? <Card><CardContent className="p-12 text-center text-zinc-500">No favorites yet. <Link href="/shop" className="text-violet-400">Browse products</Link></CardContent></Card> : <ProductGrid products={products as never} />}
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}