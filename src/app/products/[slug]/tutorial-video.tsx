'use client'
import { useState } from 'react'
import { PlayCircle, Video, X } from 'lucide-react'

/**
 * Tutorial video embed — YouTube-only.
 * Renders a branded thumbnail with a gold play button; the iframe (youtube-nocookie)
 * is only injected after the visitor clicks. Matches the site's frameless style.
 */
export function TutorialVideo({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false)

  const id = (() => {
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
      return u.searchParams.get('v')
    } catch { return null }
  })()
  if (!id) return null

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-black">
      {!playing ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label="Play tutorial video"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt="Tutorial video preview"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 transition group-hover:from-black/90" />
          <PlayCircle className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-[#f5c451] drop-shadow-[0_0_20px_rgba(245,196,81,0.6)] transition group-hover:scale-110" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs text-zinc-400">
            <Video className="h-4 w-4 text-[#f5c451]" /> Watch tutorial — click to play
          </div>
        </button>
      ) : (
        <>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title="Product tutorial video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
          <button
            type="button"
            onClick={() => setPlaying(false)}
            aria-label="Close video"
            className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white/80 backdrop-blur hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}
