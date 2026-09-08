// Client pieces of the navbar (expandable search + mobile menu).
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'

export function NavbarSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) window.location.href = '/search?q=' + encodeURIComponent(q.trim())
  }

  return open ? (
    <form onSubmit={submit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
      <input
        ref={inputRef}
        value={q}
        onChange={e => setQ(e.target.value)}
        onBlur={() => { if (!q) setOpen(false) }}
        placeholder="What are you looking for?"
        className="w-40 sm:w-56 rounded-full border border-[#22d3ee]/30 bg-[#111] pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/50 transition-all"
      />
      <button type="button" onClick={() => { setOpen(false); setQ('') }} aria-label="Close search"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} aria-label="Search"
      className="rounded-full border border-white/15 bg-transparent p-2.5 text-zinc-300 transition hover:border-[#22d3ee]/50 hover:text-[#22d3ee]">
      <Search className="h-[18px] w-[18px]" />
    </button>
  )
}

export function NavbarMobile({ cats, siteName, siteIcon }: { cats: { name: string; slug: string }[]; siteName: string; siteIcon: string | null }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label="Menu" className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute top-[72px] left-0 right-0 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            <Link href="/shop" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-[#f5c451] hover:bg-white/5">Shop</Link>
            {cats.map(c => <Link key={c.slug} href={`/categories/${c.slug}`} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white">{c.name}</Link>)}
            <Link href="/faq" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white">FAQ</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white">Contact</Link>
          </div>
        </div>
      )}
    </>
  )
}
