'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Cinematic product gallery slider — frameless image, gradient fade at bottom,
 * arrows appear on hover, gold progress dots. Same style as the hero slider.
 * Manual navigation (arrows/dots) resets the auto-advance timer.
 */
export function ImageSlider({
  images,
  alt,
  className = '',
  aspect = 'aspect-[4/3]',
  autoMs = 0, // 0 = manual only; >0 = auto-advance interval
  showDots = true,
}: {
  images: string[]
  alt: string
  className?: string
  aspect?: string
  autoMs?: number
  showDots?: boolean
}) {
  const safe = images.length ? images : ['']
  const [index, setIndex] = useState(0)
  const [tick, setTick] = useState(0) // bumped on manual nav → restarts the interval

  const go = useCallback((i: number) => {
    setIndex(((i % safe.length) + safe.length) % safe.length)
    setTick(t => t + 1) // reset the auto-advance countdown
  }, [safe.length])

  useEffect(() => {
    if (index >= safe.length) setIndex(0)
  }, [safe.length, index])

  // auto-advance: re-created whenever `tick` changes, so manual nav resets the timer
  useEffect(() => {
    if (!autoMs || safe.length < 2) return
    const t = setInterval(() => setIndex(i => (i + 1) % safe.length), autoMs)
    return () => clearInterval(t)
  }, [autoMs, safe.length, tick])

  return (
    <div className={`group/slider relative overflow-hidden rounded-2xl ${aspect} ${className}`}>
      {safe.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop'}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`}
        />
      ))}
      {/* cinematic bottom fade (no frame) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent" />

      {safe.length > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white opacity-0 backdrop-blur-sm transition group-hover/slider:opacity-100 hover:bg-black/70">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white opacity-0 backdrop-blur-sm transition group-hover/slider:opacity-100 hover:bg-black/70">
            <ChevronRight className="h-4 w-4" />
          </button>
          {showDots && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {safe.map((_, i) => (
                <button key={i} type="button" onClick={() => go(i)} aria-label={`Image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-[#f5c451]' : 'w-1.5 bg-white/40 hover:bg-white/70'}`} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
