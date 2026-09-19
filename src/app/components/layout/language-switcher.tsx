'use client'
import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { LANGS, type Lang } from '@/lib/i18n'

/**
 * CineFlow language switcher: pill button with the active flag + label,
 * opens a small dropdown with the other language. Writes the `lang` cookie
 * server-side via /api/lang and does a full reload (keeps the current page).
 */
export function LanguageSwitcher({ lang, align = 'right' }: { lang: Lang; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = LANGS.find(l => l.code === lang) || LANGS[0]

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function choose(code: Lang) {
    setOpen(false)
    if (code === lang) return
    await fetch('/api/lang', { method: 'POST', body: JSON.stringify({ lang: code }), headers: { 'Content-Type': 'application/json' } })
    window.location.reload()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-transparent px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-[#22d3ee]/50 hover:text-[#22d3ee]"
      >
        <Globe className="h-[15px] w-[15px]" />
        <span className="text-[13px] leading-none">{active.flag}</span>
        <span className="hidden sm:inline leading-none">{active.label}</span>
      </button>
      {open && (
        <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} w-40 rounded-2xl border border-white/10 bg-[#111]/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/60 z-50`}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${l.code === lang ? 'bg-[#22d3ee]/10 text-[#22d3ee]' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-[15px] leading-none">{l.flag}</span>
              <span className="flex-1 text-left leading-none">{l.label}</span>
              {l.code === lang && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
