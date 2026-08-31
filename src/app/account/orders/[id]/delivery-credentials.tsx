'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function DeliveryCredentials({ inventory }: { inventory: { product_data: Record<string,string> }[] }) {
  const [copied, setCopied] = useState<string|null>(null)
  function copy(key: string, val: string) {
    navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(()=>setCopied(null), 1500)
  }
  if (!inventory?.length) return null
  return (
    <div className="space-y-3">
      {inventory.map((inv,i)=>(
        <div key={i} className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm space-y-2">
          {Object.entries(inv.product_data).filter(([k])=>k!=='delivered_by').map(([k,v])=>(
            <div key={k} className="flex items-center justify-between gap-2 bg-zinc-900 rounded-lg px-3 py-2">
              <div><span className="text-xs text-zinc-500 block">{k}</span><span className="text-white font-bold break-all">{String(v)}</span></div>
              <button onClick={()=>copy(i+'-'+k, String(v))} className="shrink-0 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
                {copied === i+'-'+k ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      ))}
      <p className="text-xs text-zinc-500">Credentials are only visible to you. Do not share them.</p>
    </div>
  )
}
