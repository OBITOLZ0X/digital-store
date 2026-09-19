'use client'
import { useState } from 'react'
import { MessageCircle, Send, Mail, AtSign, Share2, Globe, Copy, Check, ExternalLink } from 'lucide-react'

const ICONS: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle, telegram: Send, email: Mail, instagram: AtSign, facebook: Share2, custom: Globe,
}

/**
 * Contact channel buttons. When a period is selected above (ProductPurchase),
 * the pre-filled message includes product name + period + price.
 */
export function ContactButtons({
  channels,
  productName,
  selected,
  currency = 'DZD',
}: {
  channels: { id: string; label: string; type: string; url: string; color: string }[]
  productName: string
  selected?: { id: string; name: string; price: number; duration_days: number | null } | null
  currency?: string
}) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(id: string, value: string) {
    navigator.clipboard.writeText(value)
    setCopied(id); setTimeout(() => setCopied(null), 1500)
  }

  const lines = [`Hello! I want to buy: ${productName}`]
  if (selected) {
    lines.push(`Period: ${selected.name}${selected.duration_days ? ` (${selected.duration_days} days)` : ''}`)
    lines.push(`Price: ${Number(selected.price).toLocaleString('en-US')} ${currency}`)
  }
  const msg = encodeURIComponent(lines.join('\n'))

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {channels.map(c => {
        const Icon = ICONS[c.type] || Globe
        const href = (c.type === 'whatsapp' && c.url.includes('wa.me'))
          ? `${c.url}?text=${msg}`
          : c.url
        return (
          <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#111] p-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (c.color || '#f5c451') + '22', color: c.color || '#22d3ee' }}>
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
              style={{ backgroundColor: c.color || '#f5c451' }}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )
      })}
    </div>
  )
}
