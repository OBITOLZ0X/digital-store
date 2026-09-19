'use client'
import { useState } from 'react'
import { Plus, X, Image as ImageIcon, Type, Tag, DollarSign } from 'lucide-react'
import { Button } from '@/app/components/ui/ui'

interface VariantRow { id: string; name: string; price: string; duration: string }
interface ChannelRow { id: string; label: string; type: string; url: string; color: string }

export function ProductForm({ onSubmit }: { onSubmit: (d: {
  name: string; description: { en: string; fr: string }; tagline?: { en: string; fr: string }
  price: string; comparePrice: string; category: string; imageUrl: string; gallery: string
  variants: VariantRow[]; channels: ChannelRow[]; durationDays: string; categoryImage: string;
  categoryImageUrl: string; isFeatured: boolean; isCategoryImage: boolean;
}) => void }) {
  const [name, setName] = useState(''); const [description, setDescription] = useState({ en: '', fr: '' })
  const [tagline, setTagline] = useState({ en: '', fr: '' })
  const [price, setPrice] = useState(''); const [comparePrice, setComparePrice] = useState('')
  const [category, setCategory] = useState(''); const [imageUrl, setImageUrl] = useState(''); const [gallery, setGallery] = useState('')
  const [variants, setVariants] = useState<VariantRow[]>([{ id: '1', name: '', price: '', duration: '' }])
  const [channels, setChannels] = useState<ChannelRow[]>([{ id: '1', label: '', type: 'whatsapp', url: '', color: '#22d3ee' }])
  const [durationDays, setDurationDays] = useState('30')
  const [categoryImage, setCategoryImage] = useState(''); const [categoryImageUrl, setCategoryImageUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(true); const [isCategoryImage, setIsCategoryImage] = useState(false)

  function addVariant() { setVariants(v => [...v, { id: String(v.length + 1), name: '', price: '', duration: '' }]) }
  function removeVariant(id: string) { setVariants(v => v.length > 1 ? v.filter(x => x.id !== id) : v) }
  function updateVariant(id: string, k: keyof VariantRow, v: string) {
    setVariants(prev => prev.map(row => row.id === id ? { ...row, [k]: v } : row))
  }
  function addChannel() { setChannels(c => [...c, { id: String(c.length + 1), label: '', type: 'whatsapp', url: '', color: '#22d3ee' }]) }
  function removeChannel(id: string) { setChannels(c => c.length > 1 ? c.filter(x => x.id !== id) : c) }
  function updateChannel(id: string, k: keyof ChannelRow, v: string) {
    setChannels(prev => prev.map(row => row.id === id ? { ...row, [k]: v } : row))
  }

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Type className="h-4 w-4 text-[#22d3ee]" /> Product name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Premium IPTV 1 Month" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22d3ee]/50" />
      </div>

      {/* Description bilingual */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Description — EN</label>
          <textarea value={description.en} onChange={e => setDescription(d => ({...d, en: e.target.value}))} rows={3} placeholder="1 Month Premium IPTV subscription..." className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22d3ee]/50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Description — FR</label>
          <textarea value={description.fr} onChange={e => setDescription(d => ({...d, fr: e.target.value}))} rows={3} placeholder="Abonnement IPTV Premium 1 mois..." className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22d3ee]/50" />
        </div>
      </div>

      {/* Tagline bilingual */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Tagline — EN</label>
          <input value={tagline.en} onChange={e => setTagline(t => ({...t, en: e.target.value}))} placeholder="Unlimited devices • 4K" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22d3ee]/50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Tagline — FR</label>
          <input value={tagline.fr} onChange={e => setTagline(t => ({...t, fr: e.target.value}))} placeholder="Appareils illimités • 4K" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#22d3ee]/50" />
        </div>
      </div>

      {/* Price + compare + category + image */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><DollarSign className="h-4 w-4 text-[#f5c451]" /> Price ({'\u00A3'}DZD)</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="999" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#f5c451]/50" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Compare at (DZD)</label>
          <input value={comparePrice} onChange={e => setComparePrice(e.target.value)} placeholder="1499" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Category</label>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="iptv, gamecards..." className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
        </div>
      </div>

      {/* Images */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Product image URL</label>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://.../product.jpg" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Gallery URLs (comma sep.)</label>
          <input value={gallery} onChange={e => setGallery(e.target.value)} placeholder="https://...,https://..." className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">Durations (variants)</h3>
          <button type="button" onClick={addVariant} className="text-xs text-[#22d3ee] hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
        </div>
        {variants.map(v => (
          <div key={v.id} className="flex gap-2 items-center">
            <input value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)} placeholder="1 Month" className="w-32 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-white outline-none focus:border-[#22d3ee]/50" />
            <input value={v.price} onChange={e => updateVariant(v.id, 'price', e.target.value)} placeholder="499" className="w-28 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-white outline-none focus:border-[#f5c451]/50" />
            <input value={v.duration} onChange={e => updateVariant(v.id, 'duration', e.target.value)} placeholder="30d" className="w-20 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-white outline-none focus:border-white/20" />
            <button type="button" onClick={() => removeVariant(v.id)} className="p-2 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {/* Channels */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">Contact channels (WhatsApp, Telegram...)</h3>
          <button type="button" onClick={addChannel} className="text-xs text-[#22d3ee] hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
        </div>
        {channels.map(c => (
          <div key={c.id} className="flex gap-2 items-center">
            <select value={c.type} onChange={e => updateChannel(c.id, 'type', e.target.value)} className="w-36 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-white outline-none">
              <option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="email">Email</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="custom">Custom</option>
            </select>
            <input value={c.label} onChange={e => updateChannel(c.id, 'label', e.target.value)} placeholder="My WhatsApp" className="w-36 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-white outline-none focus:border-white/20" />
            <input value={c.url} onChange={e => updateChannel(c.id, 'url', e.target.value)} placeholder="https://wa.me/..." className="flex-1 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-white outline-none focus:border-white/20" />
            <input value={c.color} onChange={e => updateChannel(c.id, 'color', e.target.value)} placeholder="#22d3ee" className="w-24 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs text-white outline-none focus:border-white/20" />
            <button type="button" onClick={() => removeChannel(c.id)} className="p-2 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {/* Category image */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Category image (shown instead of product images on category page)</label>
        <input value={categoryImageUrl} onChange={e => setCategoryImageUrl(e.target.value)} placeholder="https://.../category-banner.jpg" className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" />
        <label className="flex items-center gap-2 text-xs text-zinc-500"><input type="checkbox" checked={isCategoryImage} onChange={e => setIsCategoryImage(e.target.checked)} className="accent-[#f5c451]" /> This category uses a fixed banner (no product images on its page)</label>
      </div>

      {/* Featured */}
      <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="accent-[#f5c451]" /> Mark as featured (appears on home, badge + glow)</label>

      <Button variant="primary" onClick={() => onSubmit({ name, description, tagline, price, comparePrice, category, imageUrl, gallery, variants, channels, durationDays, categoryImage, categoryImageUrl, isFeatured, isCategoryImage })}>
        Add Product
      </Button>
    </div>
  )
}