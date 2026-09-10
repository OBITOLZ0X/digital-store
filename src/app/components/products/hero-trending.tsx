'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroProduct {
  id: string
  name: string
  slug: string
  image_url: string | null
  price: number
}

interface CurrencyProp { currency?: string }

/**
 * Minimal cinematic poster slider — pure product images, no frames/badges.
 * Hover reveals a bottom gradient with name + "From X" price. Auto-rotates,
 * arrows on hover, snap dots. Click → product page.
 */
export function HeroTrending({ products, currency = 'DZD' }: { products: HeroProduct[] } & CurrencyProp) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = products.length

  useEffect(() => {
    if (count < 2 || paused) return
    const t = setInterval(() => setIndex(i => (i + 1) % count), 4500)
    return () => clearInterval(t)
  }, [count, paused])

  if (count === 0) return null

  return (
    <div
      className="relative w-full max-w-[340px] mx-auto lg:mx-0 lg:justify-self-end"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* soft ambient glow behind (no frame) */}
      <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,_rgba(245,196,81,0.14),transparent_65%)] blur-2xl pointer-events-none" />

      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className={`absolute inset-0 transition-all duration-700 ease-out ${i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04] pointer-events-none'}`}
          >
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]" />
            )}
            {/* hover overlay: name + price */}
            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-5 pb-5 pt-16 transition-opacity duration-300 ${i === index ? 'opacity-0 group-hover:opacity-100 hover:opacity-100' : ''}`}>
              <div className="font-bold text-white text-lg leading-tight line-clamp-2">{p.name}</div>
              <div className="mt-1 text-sm font-semibold text-[#f5c451]">
                From {Number(p.price).toLocaleString('en-US')} {currency}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* arrows (visible on hover of the whole slider) */}
      {count > 1 && (
        <>
          <button
            onClick={() => setIndex(i => (i - 1 + count) % count)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/70 group-hover:opacity-100 [div:hover>&]:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIndex(i => (i + 1) % count)}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/70 [div:hover>&]:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* minimal dots */}
      {count > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-[#f5c451]' : 'w-1.5 bg-white/25 hover:bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
