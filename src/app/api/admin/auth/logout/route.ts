import { NextResponse } from 'next/server'
import { sessionCookieOptions } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ success: true })
  const opts = sessionCookieOptions()
  res.cookies.set(opts.name, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
