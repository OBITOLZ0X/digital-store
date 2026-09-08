import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, createSessionValue, sessionCookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!verifyCredentials(String(email || ''), String(password || ''))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const res = NextResponse.json({ success: true })
    const opts = sessionCookieOptions()
    res.cookies.set(opts.name, createSessionValue(), {
      httpOnly: opts.httpOnly, sameSite: opts.sameSite, secure: opts.secure, path: opts.path, maxAge: opts.maxAge,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
