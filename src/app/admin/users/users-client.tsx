'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label } from '@/app/components/ui/ui'
import { Shield, Wallet, Ban, Search, Loader2, Trash2, Plus, X } from 'lucide-react'

type UserRow = {
  id: string
  email: string
  full_name: string
  role: string
  is_verified: boolean
  created_at: string
  wallet: { balance: number; is_frozen: boolean }
}

export default function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', password: '', full_name: '', role: 'customer', initial_balance: '0' })
  const [addBusy, setAddBusy] = useState(false)

  const filtered = q.trim() === '' ? users : users.filter(u =>
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    u.full_name.toLowerCase().includes(q.toLowerCase()) ||
    u.role.toLowerCase().includes(q.toLowerCase())
  )

  async function patchUser(id: string, body: Record<string, unknown>) {
    setBusy(id); setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data.user } : u))
      setMsg({ ok: true, text: 'Updated ✓' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' })
    } finally { setBusy(null) }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}?\n\nThis permanently deletes auth user, profile, wallet and is irreversible!`)) return
    const typed = prompt(`Type the email "${email}" to confirm:`)
    if (typed !== email) { alert('Email mismatch — cancelled'); return }
    setBusy(id); setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setUsers(prev => prev.filter(u => u.id !== id))
      setMsg({ ok: true, text: `Deleted ${email} ✓` })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' })
    } finally { setBusy(null) }
  }

  async function addUser() {
    if (!addForm.email || !addForm.password) { setMsg({ ok: false, text: 'Email and password required' }); return }
    setAddBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addForm.email.trim(),
          password: addForm.password,
          full_name: addForm.full_name.trim(),
          role: addForm.role,
          initial_balance: Number(addForm.initial_balance) || 0,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setUsers(prev => [data.user, ...prev])
      setMsg({ ok: true, text: `Created ${data.user.email} ✓` })
      setAddForm({ email: '', password: '', full_name: '', role: 'customer', initial_balance: '0' })
      setShowAdd(false)
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' })
    } finally { setAddBusy(false) }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-xl p-3 border text-sm ${msg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <Card>
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search email, name, role..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="text-xs text-zinc-500">{filtered.length} / {users.length} users</div>
          <div className="ml-auto">
            <Button onClick={() => setShowAdd(v => !v)} variant={showAdd ? 'outline' : 'default'} size="sm">
              {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showAdd ? 'Cancel' : 'Add user'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add new user</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Email *</Label>
                <Input placeholder="newuser@example.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Password * (min 6)</Label>
                <Input type="password" placeholder="••••••••" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <Label>Full name</Label>
                <Input placeholder="John Doe" value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white">
                  <option value="customer">customer</option>
                  <option value="admin">admin</option>
                  <option value="super_admin">super_admin</option>
                </select>
              </div>
              <div>
                <Label>Initial wallet balance (DZD)</Label>
                <Input type="number" placeholder="0" value={addForm.initial_balance} onChange={e => setAddForm(f => ({ ...f, initial_balance: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={addUser} disabled={addBusy}>{addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create user</Button>
            </div>
            <p className="text-xs text-zinc-600">Creates auth user via service_role with email auto-confirmed. Profile + wallet are created automatically by DB triggers.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400">
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-right">Wallet</th>
                <th className="p-3 text-left">Joined</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-zinc-500">No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-zinc-900/30">
                  <td className="p-3">
                    <div className="font-medium text-white">{u.full_name || '—'}</div>
                    <div className="text-xs text-zinc-500 font-mono">{u.email}</div>
                    <div className="text-[10px] text-zinc-600 font-mono truncate max-w-[220px]">{u.id}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant={u.role === 'admin' || u.role === 'super_admin' ? 'success' : u.role === 'customer' ? 'secondary' : 'warning'}>
                      {u.role}
                    </Badge>
                    {u.is_verified && <span className="ml-1 text-[10px] text-emerald-400">✓ verified</span>}
                  </td>
                  <td className="p-3 text-right">
                    <div className={`font-mono font-bold ${u.wallet.is_frozen ? 'text-red-400' : 'text-white'}`}>
                      {Number(u.wallet.balance).toFixed(2)} DZD
                    </div>
                    {u.wallet.is_frozen && <div className="text-[10px] text-red-400 flex items-center justify-end gap-1"><Ban className="h-3 w-3" /> frozen</div>}
                  </td>
                  <td className="p-3 text-xs text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1 flex-wrap max-w-[260px] ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === u.id}
                        onClick={() => patchUser(u.id, { role: u.role === 'admin' ? 'customer' : 'admin' })}
                        title={u.role === 'admin' ? 'Demote to customer' : 'Promote to admin'}
                      >
                        {busy === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                        {u.role === 'admin' ? 'Demote' : 'Make admin'}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.wallet.is_frozen ? 'default' : 'outline'}
                        disabled={busy === u.id}
                        onClick={() => patchUser(u.id, { toggle_freeze: true })}
                      >
                        <Ban className="h-3 w-3" /> {u.wallet.is_frozen ? 'Unfreeze' : 'Freeze'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === u.id}
                        onClick={() => {
                          const amt = prompt('Amount to add (negative to deduct), e.g. 1000 or -500:')
                          if (amt === null) return
                          const n = Number(amt)
                          if (isNaN(n) || n === 0) { alert('Invalid amount'); return }
                          patchUser(u.id, { adjust_balance: n })
                        }}
                      >
                        <Wallet className="h-3 w-3" /> ± Balance
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy === u.id}
                        onClick={() => deleteUser(u.id, u.email)}
                        title="Permanently delete user"
                      >
                        {busy === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-600">
        Roles in <code className="text-zinc-400">profiles.role</code> · Wallets in <code className="text-zinc-400">wallets</code> · Use <code className="text-zinc-400">± Balance</code> for admin credit/debit (logged in <code className="text-zinc-400">wallet_transactions</code>).
        <br />Delete is permanent — it calls <code className="text-zinc-400">supabase.auth.admin.deleteUser()</code> (service_role).
      </p>
    </div>
  )
}
