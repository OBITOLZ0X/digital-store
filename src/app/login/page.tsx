'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/ui'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState<string|null>(null)
  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setMsg(null)
    try{
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if(error) throw error
      window.location.href='/'
    } catch(err){ setMsg(err instanceof Error? err.message: 'Login failed') }
    finally{ setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white">DS</div>
          <CardTitle className="mt-4 text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your DigitalStore account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <div className="flex justify-between items-center"><Label>Password</Label><Link href="/forgot-password" className="text-xs text-violet-400 hover:underline">Forgot?</Link></div>
              <Input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-1.5" />
            </div>
            {msg && <div className="text-sm rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-400">{msg}</div>}
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">{loading?'Signing in...':'Sign In'}</Button>
            <p className="text-sm text-center text-zinc-500">No account? <Link href="/register" className="text-violet-400 hover:underline">Create one</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
