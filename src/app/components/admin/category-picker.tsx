'use client'

import { useState } from 'react'
import { Check, Star, Search } from 'lucide-react'

export interface CatOption { id: string; name: string; slug: string }

/**
 * Modern multi-category picker: chip grid + search filter.
 * First selected chip = primary category (starred, shown in breadcrumbs).
 * Click again to un-select; the primary always follows order of selection.
 */
export function CategoryPicker({
  categories,
  selected,
  onChange,
}: {
  categories: CatOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [q, setQ] = useState('')
  const list = categories.filter(c => c.name.toLowerCase().includes(q.toLowerCase().trim()))
  const primary = selected[0] || null

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id))
    } else {
      onChange([...selected, id])
    }
  }

  function makePrimary(id: string) {
    onChange([id, ...selected.filter(x => x !== id)])
  }

  if (categories.length === 0) {
    return <p className="text-xs text-zinc-600">No categories yet — add some in the Categories section.</p>
  }

  return (
    <div className="space-y-2">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Filter categories..."
          className="w-full rounded-xl border border-white/10 bg-[#0d0d0d] pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/40"
        />
      </div>

      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {list.length === 0 && <span className="text-xs text-zinc-600">No match for “{q}”.</span>}
        {list.map(c => {
          const idx = selected.indexOf(c.id)
          const on = idx >= 0
          const isPrimary = on && idx === 0
          return (
            <div key={c.id} className="relative">
              <button
                type="button"
                onClick={() => toggle(c.id)}
                className={`flex items-center gap-1.5 rounded-full border pl-2.5 pr-3 py-1.5 text-xs font-medium transition-all ${
                  isPrimary
                    ? 'border-[#f5c451] bg-[#f5c451]/15 text-[#f5c451] shadow-[0_0_15px_rgba(245,196,81,0.2)]'
                    : on
                      ? 'border-[#22d3ee]/50 bg-[#22d3ee]/10 text-[#22d3ee]'
                      : 'border-white/10 bg-[#111] text-zinc-400 hover:border-white/25 hover:text-white'
                }`}
                title={on ? 'Click to remove' : 'Click to add'}
              >
                {on ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current opacity-40" />}
                {c.name}
              </button>
              {on && !isPrimary && selected.length > 1 && (
                <button
                  type="button"
                  onClick={() => makePrimary(c.id)}
                  title="Make primary"
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-[#111] border border-white/15 p-0.5 text-zinc-500 hover:text-[#f5c451] hover:border-[#f5c451]/50 transition"
                >
                  <Star className="h-2.5 w-2.5" />
                </button>
              )}
              {isPrimary && (
                <span className="absolute -top-2 -right-1.5 rounded-full bg-[#f5c451] p-0.5 text-black shadow-[0_0_10px_rgba(245,196,81,0.5)]" title="Primary category">
                  <Star className="h-2.5 w-2.5 fill-black" />
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-zinc-600">
        {selected.length === 0
          ? 'No category selected — product shows in Shop & search only.'
          : selected.length === 1
            ? '1 category — it is also the primary (starred).'
            : <>Primary: <span className="text-[#f5c451] font-medium">{categories.find(c => c.id === primary)?.name}</span> · {selected.length - 1} more (click a chip to add, ✕ to remove, ★ to set primary)</>}
      </p>
    </div>
  )
}
