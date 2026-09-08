import Link from 'next/link'
import { Star, Zap, ArrowRight } from 'lucide-react'
import { Card, CardContent, Badge, Button } from '@/app/components/ui/ui'

// Landing-style card: price + durations + "order via chat" CTA. No stock, no cart.
export function ProductCard({ product, currency = 'DZD' }: { product: Record<string, unknown> & { id:string; name:string; slug:string; image_url?:string|null; price:number; compare_at_price?:number|null; is_featured?:boolean; variants?:{name:string;price:number;duration_days?:number|null}[] }; currency?: string }){
  const img = product.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'
  const discount = product.compare_at_price ? Math.round((1 - Number(product.price)/Number(product.compare_at_price))*100) : 0
  const variants = (product.variants as {name:string;price:number;duration_days?:number|null}[]) || []
  const multi = variants.length > 1
  return (
    <Card className="group overflow-hidden hover:border-violet-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-600/10 flex flex-col">
      <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-zinc-800 block">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
          {product.is_featured && <Badge className="bg-amber-500 text-black"><Zap className="h-3 w-3 mr-1"/> Featured</Badge>}
        </div>
      </Link>
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <Link href={`/products/${product.slug}`} className="font-semibold text-white line-clamp-2 hover:text-violet-400 transition leading-tight">{product.name}</Link>
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({length:5}).map((_,i)=>(<Star key={i} className={`h-3.5 w-3.5 ${i<4?'fill-amber-400 text-amber-400':'text-zinc-700'}`} />))}
          </div>
        </div>
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {variants.slice(0,3).map((v,i)=>(
              <span key={i} className={`text-[11px] px-2 py-1 rounded-lg border ${v.price===Math.min(...variants.map(x=>Number(x.price)))?'border-violet-600/40 bg-violet-600/10 text-violet-300':'border-zinc-800 bg-zinc-900 text-zinc-400'}`}>
                {v.name} · {Number(v.price).toFixed(0)} {currency}
              </span>
            ))}
            {variants.length > 3 && <span className="text-[11px] text-zinc-500 self-center">+{variants.length-3} more</span>}
          </div>
        )}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              {multi ? `From ${Number(product.price).toFixed(2)}` : Number(product.price).toFixed(2)}
              {' '}<span className="text-xs font-normal text-zinc-500">{currency}</span>
            </span>
            {product.compare_at_price ? <span className="text-xs text-zinc-500 line-through">{Number(product.compare_at_price).toFixed(2)}</span> : null}
          </div>
          <Link href={`/products/${product.slug}`}><Button size="sm" variant="outline" className="rounded-full">Details <ArrowRight className="h-3.5 w-3.5"/></Button></Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductGrid({ products, currency = 'DZD' }: { products: (Record<string, unknown> & { id:string; name:string; slug:string; image_url?:string|null; price:number; compare_at_price?:number|null; is_featured?:boolean; variants?:{name:string;price:number}[] })[]; currency?: string }){
  if (!products.length) return <div className="text-center py-12 text-zinc-500">No products found.</div>
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{products.map(p=><ProductCard key={p.id} product={p} currency={currency} />)}</div>
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
