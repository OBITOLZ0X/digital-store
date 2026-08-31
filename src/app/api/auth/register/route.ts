import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { sendEmail, verificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const fullName = String(body.full_name || body.fullName || '').trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // generateLink creates the user WITHOUT sending Supabase's own email
    // we then send our branded email via Gmail (free)
    const { data, error } = await (supabase.auth.admin as any).generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
        redirectTo: `${appUrl}/login?verified=1`,
      },
    })

    if (error) {
      // Supabase returns "User already registered" etc.
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const actionLink: string | undefined =
      (data as any)?.properties?.action_link ||
      (data as any)?.properties?.actionLink ||
      (data as any)?.action_link

    if (!actionLink) {
      console.error('[register] generateLink returned no action_link', data)
      return NextResponse.json({ error: 'Failed to generate verification link' }, { status: 500 })
    }

    // Send branded verification email via Gmail SMTP (free)
    const siteName = process.env.EMAIL_FROM_NAME || 'DigitalStore'
    const branded = verificationEmail({
      confirmationUrl: actionLink,
      email,
      siteName,
      siteUrl: appUrl,
    })

    const sent = await sendEmail({ to: email, subject: branded.subject, html: branded.html, text: branded.text })

    if (!sent.ok) {
      console.error('[register] sendEmail failed:', sent.error, ' — user was created, link:', actionLink)
      // Still return success but warn — user exists, they can request resend
      return NextResponse.json({
        ok: true,
        warning: 'Account created but verification email failed to send. Please contact support or try resending.',
        error: sent.error,
      })
    }

    return NextResponse.json({ ok: true, message: 'Account created! Check your email to verify.' })
  } catch (e) {
    console.error('[register] unexpected error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Registration failed' }, { status: 500 })
  }
}
