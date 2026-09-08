'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { Star, Zap, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, Badge, Button } from '@/app/components/ui/ui'
import { ImageSlider } from './image-slider'

// Landing-style card: price + durations + "order via chat" CTA. No stock, no cart.
export function ProductCard({ product, currency = 'DZD' }: { product: Record<string, unknown> & { id:string; name:string; slug:string; image_url?:string|null; images?:string[]; price:number; compare_at_price?:number|null; is_featured?:boolean; variants?:{name:string;price:number;duration_days?:number|null}[] }; currency?: string }){
  const gallery = (product.images as string[])?.length ? (product.images as string[]) : (product.image_url ? [product.image_url as string] : [])
  const img = gallery[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'
  const discount = product.compare_at_price ? Math.round((1 - Number(product.price)/Number(product.compare_at_price))*100) : 0
  const variants = (product.variants as {name:string;price:number;duration_days?:number|null}[]) || []
  const multi = variants.length > 1
  return (
    <Card className="group overflow-hidden hover:border-[#f5c451]/40 transition-all duration-300 hover:shadow-[0_0_35px_rgba(245,196,81,0.12)] flex flex-col bg-[#111] border-white/5">
      <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-zinc-800 block">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
          {product.is_featured && <Badge className="bg-[#f5c451] text-black border-0"><Zap className="h-3 w-3 mr-1"/> Featured</Badge>}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      </Link>
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <Link href={`/products/${product.slug}`} className="font-semibold text-white line-clamp-2 hover:text-[#f5c451] transition leading-tight">{product.name}</Link>
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({length:5}).map((_,i)=>(<Star key={i} className={`h-3.5 w-3.5 ${i<4?'fill-[#f5c451] text-[#f5c451]':'text-zinc-700'}`} />))}
          </div>
        </div>
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {variants.slice(0,3).map((v,i)=>(
              <span key={i} className={`text-[11px] px-2 py-1 rounded-lg border ${v.price===Math.min(...variants.map(x=>Number(x.price)))?'border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]':'border-white/5 bg-white/[0.03] text-zinc-400'}`}>
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
          <Link href={`/products/${product.slug}`}><Button size="sm" variant="outline" className="rounded-full border-[#22d3ee]/40 text-[#22d3ee] hover:bg-[#22d3ee]/10 hover:text-[#22d3ee]">Details <ArrowRight className="h-3.5 w-3.5"/></Button></Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductGrid({ products, currency = 'DZD' }: { products: (Record<string, unknown> & { id:string; name:string; slug:string; image_url?:string|null; images?:string[]; price:number; compare_at_price?:number|null; is_featured?:boolean; variants?:{name:string;price:number}[] })[]; currency?: string }){
  if (!products.length) return <div className="text-center py-12 text-zinc-500">No products found.</div>
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{products.map(p=><ProductCard key={p.id} product={p} currency={currency} />)}</div>
}

export function CategoryCard({ cat, previewImages = [] }: { cat: { id:string; name:string; slug:string; image_url:string|null; description:string|null }; previewImages?: string[] }){
  return (
    <Link href={`/categories/${cat.slug}`} className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-[#111] hover:border-[#22d3ee]/40 transition">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
        {previewImages.length > 1 ? (
          <ImageSlider images={previewImages} alt={cat.name} autoMs={3000} showDots={false} aspect="!absolute" className="!rounded-none !border-0 h-full" />
        ) : (
          <img
            src={previewImages[0] || cat.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=200&fit=crop'}
            alt={cat.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>
      <div className="absolute bottom-0 p-4 w-full">
        <h3 className="font-semibold text-white group-hover:text-[#22d3ee] transition">{cat.name}</h3>
        {cat.description && <p className="text-xs text-zinc-400 line-clamp-1">{cat.description}</p>}
      </div>
    </Link>
  )
}

// Horizontal scroll-snap row of category cards whose cover auto-slides through
// the covers of the products inside that category.
export function CategorySlider({ categories }: { categories: { id:string; name:string; slug:string; image_url:string|null; description:string|null; products?:{ image_url?:string|null; images?:string[] }[] }[] }){
  const rowRef = useRef<HTMLDivElement>(null)
  function scroll(dir: 1 | -1) {
    rowRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }
  return (
    <div className="relative">
      <div ref={rowRef} className="flex gap-4 overflow-x-auto pb-2 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(cat => (
          <div key={cat.id} className="snap-start shrink-0 w-[260px] sm:w-[300px]">
            <CategoryCard
              cat={cat}
              previewImages={(cat.products || []).flatMap(p => (p.images?.length ? p.images : p.image_url ? [p.image_url] : [])).slice(0, 6)}
            />
          </div>
        ))}
      </div>
      {categories.length > 3 && (
        <>
          <button onClick={() => scroll(-1)} aria-label="Scroll left" className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 p-2 text-white backdrop-blur hover:bg-black transition"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => scroll(1)} aria-label="Scroll right" className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 p-2 text-white backdrop-blur hover:bg-black transition"><ChevronRight className="h-5 w-5" /></button>
        </>
      )}
    </div>
  )
}
