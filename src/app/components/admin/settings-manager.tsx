'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from '@/app/components/ui/ui'
import { Loader2, KeyRound, Globe, LayoutDashboard, Eye, EyeOff, ArrowUp, ArrowDown, Upload, X, ImageIcon } from 'lucide-react'
import { apiGet, apiSend } from './api'

interface SectionConfig { key: string; label: string; title: string; visible: boolean; sort: number }
interface Settings {
  siteName: string; tagline: string; currency: string
  heroBadge: string; heroTitle: string; heroSubtitle: string; heroCtaText: string
  heroImages: string[]
  sections: SectionConfig[]
}

export function SettingsManager() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStore, setSavingStore] = useState(false)
  const [savingHero, setSavingHero] = useState(false)
  const [savingAuth, setSavingAuth] = useState(false)
  const [storeMsg, setStoreMsg] = useState<string | null>(null)
  const [heroMsg, setHeroMsg] = useState<string | null>(null)
  const [authMsg, setAuthMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [creds, setCreds] = useState({ current_password: '', new_email: '', new_password: '' })
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      apiGet<Settings>('/api/admin/settings'),
      apiGet<{ email: string; platform: string }>('/api/admin/credentials'),
      fetch('/api/admin/site-icon').then(r => r.ok ? r.json() : { icon: null }),
    ]).then(([s, c, ic]) => {
      setSettings(s)
      setCreds(prev => ({ ...prev, new_email: c.email || '' }))
      setPlatform(c.platform)
      setIconPreview(ic.icon || null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const [platform, setPlatform] = useState('self-hosted')

  async function saveStore(e: React.FormEvent) {
    e.preventDefault(); setSavingStore(true); setStoreMsg(null)
    try {
      await apiSend('/api/admin/settings', 'PATCH', { siteName: settings!.siteName, tagline: settings!.tagline, currency: settings!.currency })
      setStoreMsg('Saved ✓'); setTimeout(() => setStoreMsg(null), 2500)
    } catch (err) { setStoreMsg(err instanceof Error ? err.message : 'Failed') } finally { setSavingStore(false) }
  }

  async function uploadImage(file: File, folder: string): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data.url as string
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setStoreMsg('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { setStoreMsg('Icon too large (max 5MB)'); return }
    setUploadingIcon(true); setStoreMsg(null)
    try {
      const url = await uploadImage(file, 'branding')
      const r = await apiSend<{ success: boolean }>('/api/admin/site-icon', 'POST', { url })
      setIconPreview(url + (r.success ? '' : ''))
      setStoreMsg('Icon updated ✓')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setStoreMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally { setUploadingIcon(false); if (iconInputRef.current) iconInputRef.current.value = '' }
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingHero(true); setHeroMsg(null)
    try {
      const uploaded: string[] = []
      for (const f of files) {
        if (!f.type.startsWith('image/')) throw new Error('Image files only')
        if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name} too large (max 5MB)`)
        uploaded.push(await uploadImage(f, 'hero'))
      }
      setSettings(s => ({ ...s!, heroImages: [...s!.heroImages, ...uploaded] }))
    } catch (err) {
      setHeroMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally { setUploadingHero(false); if (heroInputRef.current) heroInputRef.current.value = '' }
  }

  async function saveHero(e: React.FormEvent) {
    e.preventDefault(); setSavingHero(true); setHeroMsg(null)
    try {
      await apiSend('/api/admin/settings', 'PATCH', {
        heroBadge: settings!.heroBadge,
        heroTitle: settings!.heroTitle,
        heroSubtitle: settings!.heroSubtitle,
        heroCtaText: settings!.heroCtaText,
        heroImages: settings!.heroImages,
        sections: settings!.sections,
      })
      setHeroMsg('Saved ✓'); setTimeout(() => setHeroMsg(null), 2500)
    } catch (err) { setHeroMsg(err instanceof Error ? err.message : 'Failed') } finally { setSavingHero(false) }
  }

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault(); setSavingAuth(true); setAuthMsg(null)
    try {
      const res = await apiSend<{ success?: boolean; message?: string; note?: string }>('/api/admin/credentials', 'POST', creds)
      setAuthMsg({ type: 'success', text: res.message || res.note || 'Credentials updated ✓' })
      setCreds(prev => ({ ...prev, current_password: '', new_password: '' }))
    } catch (err) {
      setAuthMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed' })
    } finally { setSavingAuth(false) }
  }

  function moveSection(key: string, dir: 1 | -1) {
    setSettings(s => {
      if (!s) return s
      const arr = [...s.sections].sort((a, b) => a.sort - b.sort)
      const i = arr.findIndex(x => x.key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return s
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...s, sections: arr.map((x, idx) => ({ ...x, sort: idx + 1 })) }
    })
  }

  if (loading || !settings) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#22d3ee]" /></div>

  const orderedSections = [...settings.sections].sort((a, b) => a.sort - b.sort)

  return (
    <div className="space-y-6">
      <Card className="border-white/10">
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-[#22d3ee]" /> Store settings</CardTitle></CardHeader>
        <CardContent className="p-6">
          <form onSubmit={saveStore} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Store name</Label>
                <Input value={settings.siteName} onChange={e => setSettings(s => ({ ...s!, siteName: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>Currency code</Label>
                <Input value={settings.currency} onChange={e => setSettings(s => ({ ...s!, currency: e.target.value }))} placeholder="DZD" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={settings.tagline} onChange={e => setSettings(s => ({ ...s!, tagline: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Site icon (favicon + navbar logo letter)</Label>
              <div className="mt-2 flex items-center gap-3">
                {iconPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconPreview} alt="Site icon" className="h-14 w-14 rounded-xl object-cover border border-white/10" />
                    <button type="button" onClick={async () => { await apiSend('/api/admin/site-icon', 'POST', { url: null }); setIconPreview(null); setTimeout(() => window.location.reload(), 500) }}
                      className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 text-zinc-400 hover:text-red-400"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#f5c451] to-[#b8860b] flex items-center justify-center font-black text-black text-lg">
                    {(settings.siteName || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <Input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" onChange={handleIconUpload} ref={iconInputRef} className="mt-0 max-w-xs" />
                  <p className="text-[11px] text-zinc-600 mt-1">Square image recommended (e.g. 256×256). Shown in the browser tab and as the navbar badge. Empty = first letter of the store name.</p>
                </div>
                {uploadingIcon && <Loader2 className="h-4 w-4 animate-spin text-[#22d3ee]" />}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={savingStore}>{savingStore && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save</Button>
              {storeMsg && <span className="text-sm text-emerald-400">{storeMsg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-[#22d3ee]" /> Homepage content</CardTitle>
          <p className="text-xs text-zinc-500">Control everything written on the homepage. Tip: wrap words in the title with | | to color them gold, e.g. <code className="bg-white/5 px-1 rounded">Premium |Digital Products| at the |Best Prices|</code></p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={saveHero} className="space-y-5">
            <div>
              <Label>Badge (small pill above the title — leave empty to hide)</Label>
              <Input value={settings.heroBadge} onChange={e => setSettings(s => ({ ...s!, heroBadge: e.target.value }))} className="mt-1.5" placeholder="Order directly via WhatsApp • Telegram" />
            </div>
            <div>
              <Label>Main title</Label>
              <Input value={settings.heroTitle} onChange={e => setSettings(s => ({ ...s!, heroTitle: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <textarea value={settings.heroSubtitle} onChange={e => setSettings(s => ({ ...s!, heroSubtitle: e.target.value }))} rows={3}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Main button text</Label>
                <Input value={settings.heroCtaText} onChange={e => setSettings(s => ({ ...s!, heroCtaText: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>Hero backdrop images</Label>
                <div className="mt-1.5 space-y-2">
                  {settings.heroImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {settings.heroImages.map((src, i) => (
                        <div key={i} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Backdrop ${i + 1}`} className="h-16 w-24 object-cover rounded-lg border border-white/10" />
                          <button type="button" onClick={() => setSettings(s => ({ ...s!, heroImages: s!.heroImages.filter((_, j) => j !== i) }))}
                            className="absolute -top-1.5 -right-1.5 bg-zinc-800 rounded-full p-0.5 text-zinc-400 hover:text-red-400"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleHeroUpload} ref={heroInputRef} className="mt-0 max-w-xs" />
                    {uploadingHero && <Loader2 className="h-4 w-4 animate-spin text-[#22d3ee]" />}
                  </div>
                  <p className="text-[11px] text-zinc-600">Netflix-style slideshow behind the hero. Upload from your device — first image shows first. Empty = uses featured product covers.</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <Label className="mb-2 block">Homepage sections — visibility, title &amp; order</Label>
              <div className="space-y-2">
                {orderedSections.map((sec, i) => (
                  <div key={sec.key} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveSection(sec.key, -1)} disabled={i === 0} className="h-7 w-7 text-zinc-500 hover:text-white"><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveSection(sec.key, 1)} disabled={i === orderedSections.length - 1} className="h-7 w-7 text-zinc-500 hover:text-white"><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <span className="text-xs text-zinc-500 w-24 shrink-0">{sec.label}</span>
                    <Input value={sec.title} onChange={e => setSettings(s => ({ ...s!, sections: s!.sections.map(x => x.key === sec.key ? { ...x, title: e.target.value } : x) }))} className="flex-1 h-8 text-xs" placeholder="Section title" />
                    <button type="button" onClick={() => setSettings(s => ({ ...s!, sections: s!.sections.map(x => x.key === sec.key ? { ...x, visible: !x.visible } : x) }))}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition ${sec.visible ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-transparent text-zinc-500'}`}>
                      {sec.visible ? <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Shown</span> : <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Hidden</span>}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={savingHero}>{savingHero && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save homepage</Button>
              {heroMsg && <span className="text-sm text-emerald-400">{heroMsg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-[#22d3ee]" /> Admin login</CardTitle></CardHeader>
        <CardContent className="p-6">
          <p className="text-xs text-zinc-500 mb-4">
            Change the email and password you use to sign in to this panel.
            {platform === 'cloudflare'
              ? ' On Cloudflare these are saved as secret variables — update them from your Worker dashboard when prompted.'
              : ' Saved on the server; takes effect after restart.'}
          </p>
          <form onSubmit={saveCredentials} className="space-y-4 max-w-md">
            <div>
              <Label>Current password (required)</Label>
              <Input type="password" value={creds.current_password} onChange={e => setCreds(c => ({ ...c, current_password: e.target.value }))} required className="mt-1.5" placeholder="Confirm it's you" />
            </div>
            <div>
              <Label>Login email</Label>
              <Input type="email" value={creds.new_email} onChange={e => setCreds(c => ({ ...c, new_email: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>New password (leave blank to keep current)</Label>
              <Input type="password" value={creds.new_password} onChange={e => setCreds(c => ({ ...c, new_password: e.target.value }))} className="mt-1.5" placeholder="min 8 characters" />
            </div>
            {authMsg && (
              <div className={`rounded-xl p-3 border text-sm ${authMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{authMsg.text}</div>
            )}
            <Button type="submit" disabled={savingAuth}>{savingAuth && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Update login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
