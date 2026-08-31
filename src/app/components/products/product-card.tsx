'use client'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Zap } from 'lucide-react'
import { Button, Badge, Card, CardContent } from '@/app/components/ui/ui'
import { ProductRatingBadge } from '@/app/components/products/product-reviews'

export function ProductCard({ product }: { product: Record<string,unknown> & { id:string; name:string; slug:string; images:string[]; price:number; compare_at_price:number|null; is_featured:boolean; product_type:string; stock:number; delivery_type?:string; category?:{name:string}|null; variants?: { price:number; stock:number }[] } }){
  const images = (product.images as string[]) || []
  const img = images[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'
  const discount = !product.variants?.length && product.compare_at_price ? Math.round((1 - Number(product.price)/Number(product.compare_at_price))*100) : 0
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  const minPrice = hasVariants ? Math.min(...(product.variants as {price:number}[]).map(v=>Number(v.price))) : Number(product.price)
  const isAutomatic = (product as any).delivery_type === 'automatic'
  const totalStock = hasVariants ? (product.variants as {stock:number}[]).reduce((s,v)=> s+Number(v.stock||0),0) : Number(product.stock)
  const inStock = isAutomatic ? true : totalStock > 0
  return (
    <Card className="group overflow-hidden hover:border-violet-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-600/10 flex flex-col">
      <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-zinc-800 block">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
          {product.is_featured && <Badge className="bg-amber-500 text-black"><Zap className="h-3 w-3 mr-1"/> Featured</Badge>}
          {isAutomatic && <Badge className="bg-emerald-600 text-white">Auto</Badge>}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${inStock ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </Link>
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <div className="text-xs text-zinc-500 mb-1">{(product.category as {name:string})?.name || product.product_type}</div>
          <Link href={`/products/${product.slug}`} className="font-semibold text-white line-clamp-2 hover:text-violet-400 transition leading-tight">{product.name}</Link>
          <ProductRatingBadge />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            {hasVariants ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-violet-400 font-semibold">From</span>
                <span className="text-lg font-bold text-white">{minPrice.toFixed(2)} <span className="text-xs font-normal text-zinc-500">DZD</span></span>
                <span className="text-[10px] text-zinc-500">{product.variants?.length} options</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">{Number(product.price).toFixed(2)} <span className="text-xs font-normal text-zinc-500">DZD</span></span>
                {product.compare_at_price && <span className="text-xs text-zinc-500 line-through">{Number(product.compare_at_price).toFixed(2)}</span>}
              </div>
            )}
          </div>
          <Link href={`/products/${product.slug}`}><Button size="sm" className="rounded-full" disabled={!inStock}><ShoppingCart className="h-4 w-4"/> Buy</Button></Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductGrid({ products }: { products: (Record<string,unknown> & { id:string; name:string; slug:string; images:string[]; price:number; compare_at_price:number|null; is_featured:boolean; product_type:string; stock:number; delivery_type?:string; category?:{name:string}|null; variants?: { price:number; stock:number }[] })[] }){
  if (!products.length) return <div className="text-center py-12 text-zinc-500">No products found.</div>
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{products.map(p=><ProductCard key={p.id} product={p} />)}</div>
}

export function CategoryCard({ cat }: { cat: { id:string; name:string; slug:string; image_url:string|null; description:string|null } }){
  const img = cat.image_url || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=200&fit=crop`
  return (
    <Link href={`/categories/${cat.slug}`} className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-violet-600/50 transition">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>
      <div className="absolute bottom-0 p-4">
        <h3 className="font-semibold text-white group-hover:text-violet-400 transition">{cat.name}</h3>
        <p className="text-xs text-zinc-400 line-clamp-1">{cat.description}</p>
      </div>
    </Link>
  )
}
