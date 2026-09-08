'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Label, Textarea, Card, CardHeader, CardTitle, CardContent, Badge } from '@/app/components/ui/ui'
import { Plus, Image, Trash2, Edit, Loader2, X } from 'lucide-react'
import { apiGet, apiSend } from './api'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', sort_order: '0' })

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    try { setCategories(await apiGet<Category[]>('/api/admin/categories')) }
    catch (e) { setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load' }) }
    finally { setLoading(false) }
  }

  function resetForm() {
    setForm({ name: '', description: '', sort_order: '0' })
    setImageUrl(null); setEditing(null)
  }

  function startEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description || '', sort_order: String(cat.sort_order ?? 0) })
    setImageUrl(cat.image_url || null); setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMsg({ type: 'error', text: 'Please select an image file' }); return }
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: 'Image too large (max 5MB)' }); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'categories')
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setImageUrl(data.url)
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' })
    } finally { setUploading(false) }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null)
    const body = { name: form.name, description: form.description, sort_order: Number(form.sort_order) || 0, image_url: imageUrl }
    try {
      if (editing) await apiSend(`/api/admin/categories/${editing.id}`, 'PATCH', body)
      else await apiSend('/api/admin/categories', 'POST', body)
      setMsg({ type: 'success', text: editing ? 'Category updated!' : 'Category created!' })
      setShowForm(false); resetForm(); fetchCategories()
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Products in it will simply have no category.')) return
    try { await apiSend(`/api/admin/categories/${id}`, 'DELETE'); setMsg({ type: 'success', text: 'Category deleted!' }); fetchCategories() }
    catch (err) { setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' }) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
        <Button onClick={() => { resetForm(); setShowForm(true) }}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>

      {msg && (
        <div className={`rounded-xl p-3 border text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>
      )}

      {showForm && (
        <Card className="border-zinc-700">
          <CardHeader><CardTitle>{editing ? 'Edit Category' : 'New Category'}</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Subscriptions" required className="mt-1.5" />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What kind of products live here…" rows={3} className="mt-1.5" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> Category image (optional)</Label>
                <div className="mt-2 space-y-2">
                  {imageUrl && (
                    <div className="relative inline-block">
                      <img src={imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-zinc-700" />
                      <button type="button" onClick={() => setImageUrl(null)} className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 text-zinc-400 hover:text-red-400"><X className="h-3 w-3" /></button>
                    </div>
                  )}
                  <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="mt-1.5" />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editing ? 'Update Category' : 'Create Category')}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-800">
                  <th className="p-3 text-left font-medium text-zinc-300">Image</th>
                  <th className="p-3 text-left font-medium text-zinc-300">Name</th>
                  <th className="p-3 text-left font-medium text-zinc-300">Slug</th>
                  <th className="p-3 text-left font-medium text-zinc-300">Sort</th>
                  <th className="p-3 text-right font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {categories.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No categories yet. Click &quot;Add Category&quot; to create one.</td></tr>
                ) : categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-zinc-900/30">
                    <td className="p-3">
                      {cat.image_url
                        ? <img src={cat.image_url} alt="" className="h-14 w-14 object-cover rounded-lg border border-zinc-700" />
                        : <div className="h-14 w-14 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700"><Image className="h-6 w-6 text-zinc-500" /></div>}
                    </td>
                    <td className="p-3 font-medium text-white">{cat.name}</td>
                    <td className="p-3 text-zinc-400 font-mono text-xs">{cat.slug}</td>
                    <td className="p-3 text-zinc-400">{cat.sort_order}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(cat)} className="text-zinc-400 hover:text-emerald-400"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
