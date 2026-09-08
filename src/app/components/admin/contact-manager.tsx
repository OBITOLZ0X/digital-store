'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/ui'
import { Plus, Trash2, Edit, Loader2, X, MessageCircle, Send, Mail, AtSign, Share2, Globe } from 'lucide-react'
import { apiGet, apiSend } from './api'

interface Channel { id: string; type: string; label: string; value: string; url: string; color: string; sort_order: number }

const TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, defaultColor: '#25D366', hint: 'Phone number with country code, e.g. 213555000000' },
  { value: 'telegram', label: 'Telegram', icon: Send, defaultColor: '#229ED9', hint: 'Username without @, e.g. mystore' },
  { value: 'email', label: 'Email', icon: Mail, defaultColor: '#EA4335', hint: 'you@example.com' },
  { value: 'instagram', label: 'Instagram', icon: AtSign, defaultColor: '#E1306C', hint: 'Username without @' },
  { value: 'facebook', label: 'Facebook', icon: Share2, defaultColor: '#1877F2', hint: 'Page name or profile id' },
  { value: 'custom', label: 'Custom link', icon: Globe, defaultColor: '#7c3aed', hint: 'Full URL, e.g. https://…' },
]

export function ContactManager() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Channel | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ type: 'whatsapp', label: '', value: '', color: '#25D366' })

  useEffect(() => { fetchChannels() }, [])

  async function fetchChannels() {
    try { setChannels(await apiGet<Channel[]>('/api/admin/contacts')) }
    catch (e) { setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load' }) }
    finally { setLoading(false) }
  }

  function typeInfo(t: string) { return TYPES.find(x => x.value === t) || TYPES[TYPES.length - 1] }

  function resetForm() {
    setForm({ type: 'whatsapp', label: '', value: '', color: '#25D366' })
    setEditing(null)
  }

  function startEdit(c: Channel) {
    setEditing(c)
    setForm({ type: c.type, label: c.label, value: c.value, color: c.color })
    setShowForm(true)
  }

  function changeType(t: string) {
    const info = typeInfo(t)
    setForm(f => ({ ...f, type: t, color: info.defaultColor, label: f.label && editing ? f.label : info.label }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      if (editing) await apiSend(`/api/admin/contacts/${editing.id}`, 'PATCH', form)
      else await apiSend('/api/admin/contacts', 'POST', form)
      setMsg({ type: 'success', text: editing ? 'Channel updated!' : 'Channel added!' })
      setShowForm(false); resetForm(); fetchChannels()
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact channel? Products using it will simply show the other channels.')) return
    try { await apiSend(`/api/admin/contacts/${id}`, 'DELETE'); fetchChannels() }
    catch (err) { setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' }) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>

  const info = typeInfo(form.type)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">These channels appear as buy buttons on product pages and on the Contact page.</p>
        <Button onClick={() => { resetForm(); setShowForm(true) }}><Plus className="h-4 w-4 mr-2" /> Add Channel</Button>
      </div>

      {msg && (
        <div className={`rounded-xl p-3 border text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>
      )}

      {showForm && (
        <Card className="border-zinc-700">
          <CardHeader><CardTitle>{editing ? 'Edit Channel' : 'New Channel'}</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onChange={e => changeType(e.target.value)} className="mt-1.5">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Display name</Label>
                  <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder={info.label} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>{info.label} — value *</Label>
                <Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={info.hint} required className="mt-1.5" />
                <p className="text-[11px] text-zinc-600 mt-1">{info.hint}</p>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10 w-14 rounded-lg bg-zinc-900 border border-zinc-700 cursor-pointer" />
                  <span className="text-xs text-zinc-500 font-mono">{form.color}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editing ? 'Update Channel' : 'Add Channel')}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500 sm:col-span-2 lg:col-span-3">
            No channels yet. Add WhatsApp, Telegram or any channel buyers will use to order.
          </div>
        )}
        {channels.map(c => {
          const Icon = typeInfo(c.type).icon
          return (
            <div key={c.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: (c.color || '#7c3aed') + '22', color: c.color || '#a78bfa' }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{c.label}</div>
                <div className="text-xs text-zinc-500 truncate">{c.value}</div>
                <div className="text-[11px] text-zinc-600 truncate mt-0.5">{c.url}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(c)} className="text-zinc-400 hover:text-emerald-400"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
