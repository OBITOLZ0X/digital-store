'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/ui'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage(){
  const [email,setEmail]=useState('')
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState<string|null>(null)
  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setMsg(null)
    try{
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
      if(error) throw error
      setMsg('If your email exists, you will receive a reset link.')
    } catch(err){ setMsg(err instanceof Error? err.message: 'Failed') }
    finally{ setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1.5" /></div>
            {msg && <div className="text-sm rounded-xl p-3 bg-zinc-900 border border-zinc-800 text-zinc-300">{msg}</div>}
            <Button type="submit" disabled={loading} className="w-full h-11">{loading?'Sending...':'Send Reset Link'}</Button>
            <p className="text-sm text-center text-zinc-500"><Link href="/login" className="text-violet-400 hover:underline">Back to login</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
