'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/ui'

export default function RegisterPage(){
  const [fullName,setFullName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState<string|null>(null)
  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setMsg(null)
    try{
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      const j = await r.json()
      if(!r.ok) throw new Error(j.error || 'Registration failed')
      if(j.warning) setMsg('⚠️ ' + j.warning)
      else setMsg('✅ Account created! Check your email (' + email + ') to verify — sent from DigitalStore. Then login.')
    } catch(err){ setMsg(err instanceof Error? err.message: 'Registration failed') }
    finally{ setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white">DS</div>
          <CardTitle className="mt-4 text-2xl">Create account</CardTitle>
          <CardDescription>Join DigitalStore — instant digital delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Full Name</Label><Input placeholder="John Doe" value={fullName} onChange={e=>setFullName(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1.5" /></div>
            <div><Label>Password</Label><Input type="password" placeholder="Min 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-1.5" /></div>
            {msg && <div className={`text-sm rounded-xl p-3 border ${msg.startsWith('✅')?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400': msg.startsWith('⚠️')?'bg-amber-500/10 border-amber-500/20 text-amber-400':'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg}</div>}
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">{loading?'Creating...':'Create Account'}</Button>
            <p className="text-sm text-center text-zinc-500">Have an account? <Link href="/login" className="text-violet-400 hover:underline">Sign in</Link></p>
            <p className="text-xs text-center text-zinc-600">Free verification email via Gmail — no paid service needed.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
