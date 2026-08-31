'use client'

import { useState, useEffect } from 'react'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Select } from '@/app/components/ui/ui'
import { Loader2, Save, Settings } from 'lucide-react'

interface Setting { id: string; key: string; value: string | null; updated_at: string }

export default function AdminSettingsPage(){
  const [settings, setSettings] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function fetchSettings(){
    setLoading(true)
    try{
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'Failed')
      const map: Record<string,string> = {}
      for(const s of (data as Setting[])) map[s.key] = s.value || ''
      setSettings(map)
    }catch(e){ setMsg({ ok:false, text: e instanceof Error ? e.message : 'Failed' })}
    finally{ setLoading(false) }
  }
  useEffect(()=>{ fetchSettings() }, [])

  async function handleSave(e: React.FormEvent){
    e.preventDefault()
    setSaving(true); setMsg(null)
    try{
      const res = await fetch('/api/admin/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(settings) })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'Failed')
      setMsg({ ok:true, text:'Settings saved ✅' })
      const map: Record<string,string> = {}
      for(const s of (data as Setting[])) map[s.key]=s.value||''
      setSettings(map)
    }catch(err){ setMsg({ ok:false, text: err instanceof Error ? err.message : 'Save failed' })}
    finally{ setSaving(false) }
  }

  if(loading) return (
    <div className="flex flex-col min-h-screen"><Navbar /><div className="mx-auto max-w-7xl w-full px-4 py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div><Footer /></div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="h-6 w-6 text-violet-400" /> Settings</h1>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-4">
            <AdminMobileNav />
            {msg && <div className={`rounded-xl p-3 border text-sm ${msg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <Card className="border-zinc-700">
                <CardHeader><CardTitle>Store</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Store Name</Label>
                    <Input value={settings['store_name']||''} onChange={e=>setSettings(s=>({...s, store_name: e.target.value}))} placeholder="Digital Store" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Store Description</Label>
                    <Textarea value={settings['store_description']||''} onChange={e=>setSettings(s=>({...s, store_description: e.target.value}))} rows={3} placeholder="Premium digital products marketplace" className="mt-1.5" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Email</Label>
                      <Input type="email" value={settings['contact_email']||''} onChange={e=>setSettings(s=>({...s, contact_email: e.target.value}))} placeholder="contact@digitalstore.dz" className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Support Hours</Label>
                      <Input value={settings['support_hours']||''} onChange={e=>setSettings(s=>({...s, support_hours: e.target.value}))} placeholder="09:00 - 22:00" className="mt-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-700">
                <CardHeader><CardTitle>Defaults</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Default Currency</Label>
                      <Select value={settings['default_currency']||'DZD'} onChange={e=>setSettings(s=>({...s, default_currency: e.target.value}))} className="mt-1.5">
                        <option value="DZD">DZD — Algerian Dinar</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Default Language</Label>
                      <Select value={settings['default_language']||'en'} onChange={e=>setSettings(s=>({...s, default_language: e.target.value}))} className="mt-1.5">
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-700">
                <CardHeader><CardTitle>Features</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div>
                      <div className="font-medium text-white text-sm">Product Ratings & Reviews</div>
                      <p className="text-xs text-zinc-500 mt-1">When enabled, customers can rate and review products. When disabled, ratings are hidden everywhere.</p>
                    </div>
                    <Select value={settings['reviews_enabled']||'false'} onChange={e=>setSettings(s=>({...s, reviews_enabled: e.target.value}))} className="w-36">
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </Select>
                  </div>
                  <div className={`text-xs px-3 py-2 rounded-lg border ${settings['reviews_enabled']==='true' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                    {settings['reviews_enabled']==='true' ? '✅ Ratings are visible — customers can see stars and submit reviews.' : '⏸️ Ratings are hidden — no stars or review forms will be shown.'}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-700">
                <CardHeader><CardTitle>System</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <Select value={settings['maintenance_mode']||'false'} onChange={e=>setSettings(s=>({...s, maintenance_mode: e.target.value}))} className="mt-1.5">
                      <option value="false">Disabled — Store is open</option>
                      <option value="true">Enabled — Store is closed (maintenance)</option>
                    </Select>
                    <p className="text-xs text-zinc-500 mt-1">When enabled, storefront can show a maintenance banner (implement per your middleware).</p>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={saving} className="w-full h-12">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Settings</>}
              </Button>
            </form>
            <p className="text-xs text-zinc-600">Stored in <code className="text-zinc-400">store_settings</code> (key/value). Changes apply immediately; default_language = <code className="text-zinc-400">ar</code> legacy values now map to English per earlier fix.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
