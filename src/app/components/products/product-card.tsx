// landing-style product card (no stock, no cart, no checkout — order via chat).
'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { Star, Zap, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, Badge, Button } from '@/app/components/ui/ui'
import { ImageSlider } from './image-slider'
import { t, useLang } from '@/lib/i18n'

export function ProductCard({ product, currency = 'DZD' }: { product: Record<string, unknown> & { id:string; name:string; slug:string; image_url?:string|null; images?:string[]; price:number; compare_at_price?:number|null; is_featured?:boolean; variants?:{name:string;price:number;duration_days?:number|null}[] }; currency?: string }) {
  const lang = useLang()
  const gallery = (product.images as string[])?.length ? (product.images as string[]) : (product.image_url ? [product.image_url as string] : [])
  const img = gallery[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'
  const discount = product.compare_at_price ? Math.round((1 - Number(product.price)/Number(product.compare_at_price))*100) : 0
  const variants = (product.variants as {name:string;price:number;duration_days?:number|null}[]) || []
  const multi = variants.length > 1
  return (
    <Card className="group overflow-hidden hover:border-[#f5c451]/40 transition-all duration-300 hover:shadow-[0_0_35px_rgba(245,196,81,0.12)] flex flex-col bg-[#111] border-white/5">
      <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-[#161616] block">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
          {product.is_featured && <Badge className="bg-[#f5c451] text-black border-0"><Zap className="h-3 w-3 mr-1"/> {t(lang, 'card.featured')}</Badge>}
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
            {variants.length > 3 && <span className="text-[11px] text-zinc-500 self-center">+{variants.length-3} {t(lang, 'card.more')}</span>}
          </div>
        )}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              {multi ? `${t(lang, 'home.from')} ${Number(product.price).toFixed(2)}` : Number(product.price).toFixed(2)}
              {' '}<span className="text-xs font-normal text-zinc-500">{currency}</span>
            </span>
            {product.compare_at_price ? <span className="text-xs text-zinc-500 line-through">{Number(product.compare_at_price).toFixed(2)}</span> : null}
          </div>
          <Link href={`/products/${product.slug}`}><Button size="sm" variant="outline" className="rounded-full border-[#22d3ee]/40 text-[#22d3ee] hover:bg-[#22d3ee]/10 hover:text-[#22d3ee]">{t(lang, 'card.details')} <ArrowRight className="h-3.5 w-3.5"/></Button></Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductGrid({ products, currency = 'DZD' }: { products: (Record<string, unknown> & { id:string; name:string; slug:string; image_url?:string|null; images?:string[]; price:number; compare_at_price?:number|null; is_featured?:boolean; variants?:{name:string;price:number}[] })[]; currency?: string }) {
  if (!products.length) return <div className="text-center py-12 text-zinc-500">{t('en', 'card.noProducts')}</div>
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{products.map(p=><ProductCard key={p.id} product={p} currency={currency} />)}</div>
}