'use client'
import { useState } from 'react'
import { Button, Input, Label, Textarea, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/ui'
import { Navbar, Footer } from '@/app/components/layout/navbar-footer'

export default function ContactPage(){
  const [sent,setSent]=useState(false)
  function onSubmit(e:React.FormEvent){ e.preventDefault(); setSent(true); setTimeout(()=>setSent(false),3000) }
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-white">Contact Us</h1>
        <p className="text-zinc-400 mt-2">We usually reply within a few hours.</p>
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader><CardTitle>Send a message</CardTitle><CardDescription>Reach our support team</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div><Label>Email</Label><Input placeholder="you@example.com" required className="mt-1.5"/></div>
                <div><Label>Subject</Label><Input placeholder="Help with order #..." required className="mt-1.5"/></div>
                <div><Label>Message</Label><Textarea placeholder="How can we help?" required className="mt-1.5" rows={5}/></div>
                <Button type="submit" className="w-full">{sent?'Message Sent ✓':'Send Message'}</Button>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card><CardContent className="p-6"><h3 className="font-semibold text-white">Email</h3><p className="text-sm text-zinc-400 mt-1">support@digitalstore.com</p></CardContent></Card>
            <Card><CardContent className="p-6"><h3 className="font-semibold text-white">Phone</h3><p className="text-sm text-zinc-400 mt-1">+213 555 00 00 00</p></CardContent></Card>
            <Card><CardContent className="p-6"><h3 className="font-semibold text-white">Address</h3><p className="text-sm text-zinc-400 mt-1">Algiers, Algeria — Available 24/7</p></CardContent></Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
