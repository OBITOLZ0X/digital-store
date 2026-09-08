'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from '@/app/components/ui/ui'
import { Loader2, KeyRound, Globe } from 'lucide-react'
import { apiGet, apiSend } from './api'

interface Settings { siteName: string; tagline: string; currency: string }

export function SettingsManager() {
  const [settings, setSettings] = useState<Settings>({ siteName: '', tagline: '', currency: 'DZD' })
  const [loading, setLoading] = useState(true)
  const [savingStore, setSavingStore] = useState(false)
  const [savingAuth, setSavingAuth] = useState(false)
  const [storeMsg, setStoreMsg] = useState<string | null>(null)
  const [authMsg, setAuthMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [creds, setCreds] = useState({ current_password: '', new_email: '', new_password: '' })

  useEffect(() => {
    Promise.all([
      apiGet<Settings>('/api/admin/settings'),
      apiGet<{ email: string; platform: string }>('/api/admin/credentials'),
    ]).then(([s, c]) => {
      setSettings(s)
      setCreds(prev => ({ ...prev, new_email: c.email || '' }))
      setPlatform(c.platform)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const [platform, setPlatform] = useState('self-hosted')

  async function saveStore(e: React.FormEvent) {
    e.preventDefault(); setSavingStore(true); setStoreMsg(null)
    try {
      await apiSend('/api/admin/settings', 'PATCH', settings)
      setStoreMsg('Saved ✓')
      setTimeout(() => setStoreMsg(null), 2500)
    } catch (err) { setStoreMsg(err instanceof Error ? err.message : 'Failed') } finally { setSavingStore(false) }
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>

  return (
    <div className="space-y-6">
      <Card className="border-zinc-700">
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-violet-400" /> Store settings</CardTitle></CardHeader>
        <CardContent className="p-6">
          <form onSubmit={saveStore} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Store name</Label>
                <Input value={settings.siteName} onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>Currency code</Label>
                <Input value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} placeholder="DZD" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={settings.tagline} onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={savingStore}>{savingStore && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save</Button>
              {storeMsg && <span className="text-sm text-emerald-400">{storeMsg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-zinc-700">
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-violet-400" /> Admin login</CardTitle></CardHeader>
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
