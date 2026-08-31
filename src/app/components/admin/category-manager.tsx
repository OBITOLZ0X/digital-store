'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Label, Textarea, Card, CardHeader, CardTitle, CardContent, Badge } from '@/app/components/ui/ui'
import { Plus, Image, Trash2, Edit, Loader2, Upload, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', sort_order: '0', is_active: true })

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) setCategories(Array.isArray(data) ? data : [])
      else setMsg({ type: 'error', text: data.error || 'Failed to load' })
    } catch { setMsg({ type: 'error', text: 'Network error' }) }
    finally { setLoading(false) }
  }

  function resetForm() {
    setForm({ name: '', slug: '', description: '', sort_order: '0', is_active: true })
    setImageFile(null); setImagePreview(null); setEditing(null)
  }

  function startEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', sort_order: String(cat.sort_order), is_active: cat.is_active })
    setImageFile(null); setImagePreview(cat.image_url || null); setShowForm(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMsg({ type: 'error', text: 'Please select an image file' }); return }
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: 'Image too large (max 5MB)' }); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null)
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('slug', form.slug || slugify(form.name))
    fd.append('description', form.description)
    fd.append('sort_order', form.sort_order)
    fd.append('is_active', form.is_active ? 'on' : 'off')
    if (imageFile) fd.append('image_file', imageFile)
    else if (imagePreview && imagePreview.startsWith('http')) fd.append('image_url', imagePreview)

    const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
    const method = editing ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, { method, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMsg({ type: 'success', text: editing ? 'Category updated!' : 'Category created!' })
      setShowForm(false); resetForm(); fetchCategories()
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMsg({ type: 'success', text: 'Category deleted!' })
      fetchCategories()
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
        {!showForm && <Button onClick={() => { resetForm(); setShowForm(true) }}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>}
      </div>

      {msg && (
        <div className={`rounded-xl p-3 border text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>
      )}

      {showForm && (
        <Card className="border-violet-600/30 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-white">{editing ? 'Edit Category' : 'New Category'}</CardTitle><Button variant="ghost" size="icon" onClick={() => { setShowForm(false); resetForm() }}><X className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} placeholder="Netflix" required className="mt-1.5" />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="netflix" required className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description of this category..." rows={3} className="mt-1.5" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="mt-1.5" />
                </div>
                <div className="flex items-center pt-6">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500" />
                    <span>Active</span>
                  </Label>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-700">
                <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Category Image</Label>
                <div className="mt-2 space-y-2">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-zinc-700" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 text-zinc-400 hover:text-red-400"><X className="h-3 w-3" /></button>
                    </div>
                  )}
                  <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="mt-1.5" />
                  <p className="text-xs text-zinc-500">PNG, JPEG, WebP — max 5MB</p>
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
                  <th className="p-3 text-left font-medium text-zinc-300">Status</th>
                  <th className="p-3 text-right font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {categories.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No categories yet. Click "Add Category" to create one.</td></tr>
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
                    <td className="p-3">
                      <Badge variant={cat.is_active ? 'default' : 'outline'} className={cat.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
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