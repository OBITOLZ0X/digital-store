'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, TrendingUp } from 'lucide-react'

interface HeroProduct {
  id: string
  name: string
  slug: string
  image_url: string | null
  views: number
}

/**
 * "Trending now" poster slider — top-5 most-visited products, shown as a
 * Netflix-style poster card on the hero's right side. Auto-rotates every 4s,
 * clickable dots + arrows, gold/cyan theme.
 */
export function HeroTrending({ products }: { products: HeroProduct[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = products.length

  useEffect(() => {
    if (count < 2 || paused) return
    const t = setInterval(() => setIndex(i => (i + 1) % count), 4000)
    return () => clearInterval(t)
  }, [count, paused])

  if (count === 0) return null

  return (
    <div
      className="relative w-full max-w-sm mx-auto lg:mx-0 lg:justify-self-end"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* glow backdrop */}
      <div className="absolute -inset-6 bg-gradient-to-tr from-[#f5c451]/20 via-transparent to-[#22d3ee]/15 blur-3xl rounded-[3rem] pointer-events-none" />

      <div className="relative rounded-3xl border border-white/10 bg-[#0d0d0d]/80 backdrop-blur-md p-3 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
        {/* header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#f5c451]">
            <TrendingUp className="h-4 w-4" /> Trending Now
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-widest">
            <Eye className="h-3 w-3" /> Most visited
          </div>
        </div>

        {/* poster */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-800">
          {products.map((p, i) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className={`absolute inset-0 transition-all duration-700 ${i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
                  <span className="text-4xl font-black text-[#f5c451]/30">{p.name.charAt(0)}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 pt-10">
                <div className="font-bold text-white leading-tight line-clamp-2">{p.name}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#22d3ee]">
                  <Eye className="h-3 w-3" /> {p.views.toLocaleString('en-US')} views
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* dots + rank */}
        <div className="flex items-center justify-between px-2 pt-3 pb-1">
          <div className="flex gap-1.5">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-[#f5c451]' : 'w-1.5 bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
          <div className="text-[10px] font-bold text-zinc-500 tabular-nums">
            <span className="text-[#f5c451]">{index + 1}</span> / {count}
          </div>
        </div>
      </div>
    </div>
  )
}
