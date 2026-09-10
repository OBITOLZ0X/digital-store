'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'

export default function AdminLoginPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [err,setErr]=useState<string|null>(null)
  const [loading,setLoading]=useState(false)
  const router=useRouter()

  async function submit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setErr(null)
    try{
      const res=await fetch('/api/admin/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})})
      const data=await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data.error||'Login failed')
      router.replace('/admin')
      router.refresh()
    }catch(error){ setErr(error instanceof Error?error.message:'Login failed'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#f5c451] to-[#b8860b] flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to manage the store</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-[#111] p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-white/5 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">Password</label>
            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-white/5 bg-[#0a0a0a] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]" placeholder="••••••••" />
          </div>
          {err && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#f5c451] text-black hover:bg-[#ffd76e] transition text-white font-medium py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
