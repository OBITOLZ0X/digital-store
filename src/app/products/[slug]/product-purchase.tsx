'use client'
import { useState } from 'react'
import { Calendar, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/app/components/ui/ui'
import { ContactButtons } from './contact-buttons'

interface Variant { id: string; name: string; price: number; duration_days: number | null; compare_at_price?: number | null }
interface Channel { id: string; label: string; type: string; url: string; color: string }

/**
 * Periods & prices — selectable rows (same place as before, top of the right column).
 * The selection flows down to the contact buttons: WhatsApp etc. open with the
 * product name + chosen period + price in the pre-filled message.
 */
export function ProductPurchase({
  variants,
  singlePrice,
  compareAtPrice,
  currency,
  productName,
  channels,
}: {
  variants: Variant[]
  singlePrice: number
  compareAtPrice: number | null
  currency: string
  productName: string
  channels: Channel[]
}) {
  const [selected, setSelected] = useState<string | null>(null)

  // TRUE best-value: lowest price per day (fallback: cheapest absolute price)
  const priced = variants.map(v => ({ ...v, perDay: v.duration_days && v.duration_days > 0 ? v.price / v.duration_days : null }))
  const withDays = priced.filter(v => v.perDay !== null)
  const bestId = withDays.length
    ? withDays.reduce((a, b) => (b.perDay! < a.perDay! ? b : a)).id
    : (variants.length ? variants.reduce((a, b) => (b.price < a.price ? b : a)).id : null)

  const multi = variants.length > 0

  function toggle(id: string) {
    setSelected(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* Pricing per period — selectable */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-[#f5c451]" /> Available periods &amp; prices</h2>
        {multi ? (
          <div className="grid gap-2.5">
            {priced.map((v, i) => {
              const isBest = bestId !== null && v.id === bestId
              const isSel = selected === v.id
              return (
                <button
                  key={v.id || i}
                  type="button"
                  onClick={() => toggle(v.id)}
                  className={`w-full text-left flex items-center justify-between rounded-2xl border p-4 transition cursor-pointer ${
                    isSel
                      ? 'border-[#22d3ee] bg-[#22d3ee]/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]'
                      : isBest
                        ? 'border-[#f5c451]/60 bg-[#f5c451]/[0.06] hover:border-[#f5c451]'
                        : 'border-white/5 bg-[#111] hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                      <span className={`h-4 w-4 shrink-0 rounded-full border-2 inline-flex items-center justify-center transition ${isSel ? 'border-[#22d3ee] bg-[#22d3ee]' : 'border-zinc-600'}`}>
                        {isSel && <span className="h-1.5 w-1.5 rounded-full bg-[#0a0a0a]" />}
                      </span>
                      {v.name}
                      {isBest && <span className="text-[10px] uppercase tracking-wide bg-[#f5c451] text-black font-bold rounded-full px-2 py-0.5">Best value</span>}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 pl-6">
                      {v.duration_days ? `${v.duration_days} days` : ''}
                      {v.perDay !== null && <span className="text-zinc-600"> • {v.perDay.toFixed(2)} {currency}/day</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black ${isSel ? 'text-[#22d3ee]' : isBest ? 'text-[#f5c451]' : 'text-white'}`}>
                      {Number(v.price).toFixed(2)} <span className="text-xs font-normal text-zinc-500">{currency}</span>
                    </div>
                    {v.compare_at_price ? <div className="text-xs text-zinc-500 line-through">{Number(v.compare_at_price).toFixed(2)} {currency}</div> : null}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">{Number(singlePrice).toFixed(2)} <span className="text-sm font-normal text-zinc-500">{currency}</span></span>
            {compareAtPrice ? <span className="text-lg text-zinc-500 line-through">{Number(compareAtPrice).toFixed(2)} {currency}</span> : null}
          </div>
        )}
        {multi && (
          <p className="text-[11px] text-zinc-600 mt-2">
            {selected ? 'Period selected ✓ — it will be included in your message below.' : 'Tap a period to choose it — the message you send will include the period and price.'}
          </p>
        )}
      </div>

      {/* Buy = contact the seller */}
      <Card className="border-[#22d3ee]/25 bg-[#22d3ee]/[0.04]">
        <CardContent className="p-5">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-1"><MessageCircle className="h-4 w-4 text-[#22d3ee]" /> How to buy this product</h3>
          <p className="text-sm text-zinc-400 mb-4">
            {multi ? (selected ? "Great — now message us below and your chosen period is already in the text." : "Pick a period above, then message us on any channel below.") : "Message us on any channel below — tell us the product and we'll confirm your order in the chat."}
          </p>
          <ContactButtons channels={channels} productName={productName} selected={selected ? variants.find(v => v.id === selected) || null : null} currency={currency} />
          {channels.length === 0 && <p className="text-sm text-amber-400">Contact channels are being set up — check back soon.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
