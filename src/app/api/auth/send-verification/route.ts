import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { sendEmail, verificationEmail } from '@/lib/email'

// POST { email } — resend verification (free via Gmail)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const clean = String(email || '').trim().toLowerCase()
    if (!clean) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabase = getServerSupabase()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data, error } = await (supabase.auth.admin as any).generateLink({
      type: 'magiclink',
      email: clean,
      options: { redirectTo: `${appUrl}/login?verified=1` },
    })
    // magiclink works for existing users; if user not found, try signup-type recovery
    let link = (data as any)?.properties?.action_link || (data as any)?.action_link
    if (error || !link) {
      const r2 = await (supabase.auth.admin as any).generateLink({
        type: 'recovery',
        email: clean,
        options: { redirectTo: `${appUrl}/login?verified=1` },
      })
      link = (r2.data as any)?.properties?.action_link || (r2.data as any)?.action_link
      if (!link) return NextResponse.json({ error: error?.message || r2.error?.message || 'Failed to generate link' }, { status: 400 })
    }

    const branded = verificationEmail({ confirmationUrl: link, email: clean, siteName: process.env.EMAIL_FROM_NAME || 'DigitalStore', siteUrl: appUrl })
    const sent = await sendEmail({ to: clean, subject: branded.subject, html: branded.html, text: branded.text })
    if (!sent.ok) return NextResponse.json({ error: sent.error || 'Failed to send email' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
