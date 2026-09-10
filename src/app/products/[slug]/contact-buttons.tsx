'use client'
import { useState } from 'react'
import { MessageCircle, Send, Mail, AtSign, Share2, Globe, Copy, Check, ExternalLink, CalendarCheck } from 'lucide-react'

const ICONS: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle, telegram: Send, email: Mail, instagram: AtSign, facebook: Share2, custom: Globe,
}

export function ContactButtons({
  channels,
  productName,
  variants = [],
}: {
  channels: { id: string; label: string; type: string; url: string; color: string }[]
  productName: string
  variants?: { id: string; name: string; price: number; duration_days: number | null }[]
}) {
  const [copied, setCopied] = useState<string | null>(null)
  // selected period — defaults to none; the pre-filled message updates with it
  const [selected, setSelected] = useState<string | null>(null)

  function copy(id: string, value: string) {
    navigator.clipboard.writeText(value)
    setCopied(id); setTimeout(() => setCopied(null), 1500)
  }

  const sel = variants.find(v => v.id === selected)
  const lines = [`Hello! I want to buy: ${productName}`]
  if (sel) {
    lines.push(`Period: ${sel.name}${sel.duration_days ? ` (${sel.duration_days} days)` : ''}`)
    lines.push(`Price: ${Number(sel.price).toLocaleString('en-US')} DZD`)
  }
  const msg = encodeURIComponent(lines.join('\n'))

  return (
    <div className="space-y-4">
      {/* selectable periods */}
      {variants.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-2">
            <CalendarCheck className="h-3.5 w-3.5 text-[#f5c451]" /> Choose your period
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {variants.map(v => {
              const on = selected === v.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelected(on ? null : v.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${on
                    ? 'border-[#f5c451] bg-[#f5c451]/10 shadow-[0_0_20px_rgba(245,196,81,0.15)]'
                    : 'border-white/10 bg-[#111] hover:border-white/20'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold ${on ? 'text-[#f5c451]' : 'text-white'}`}>
                      {on ? '✓ ' : ''}{v.name}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {Number(v.price).toLocaleString('en-US')} <span className="text-[10px] font-normal text-zinc-500">DZD</span>
                    </span>
                  </div>
                  {v.duration_days ? <div className="text-[11px] text-zinc-500 mt-0.5">{v.duration_days} days</div> : null}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            {selected ? 'Period selected — it will be included in your message.' : 'Select a period to include it in your message (optional).'}
          </p>
        </div>
      )}

      {/* contact channels */}
      <div className="grid sm:grid-cols-2 gap-3">
        {channels.map(c => {
          const Icon = ICONS[c.type] || Globe
          const href = (c.type === 'whatsapp' && c.url.includes('wa.me'))
            ? `${c.url}?text=${msg}`
            : c.url
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#111] p-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (c.color || '#7c3aed') + '22', color: c.color || '#a78bfa' }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{c.label}</div>
                <div className="text-xs text-zinc-500 truncate">{c.url.replace(/^https?:\/\//, '').replace(/^mailto:/, '')}</div>
              </div>
              <button
                type="button"
                onClick={() => copy(c.id, c.url)}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#161616] transition"
                title="Copy link"
              >
                {copied === c.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: c.color || '#7c3aed' }}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
