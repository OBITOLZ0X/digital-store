// Simple signed-session auth for the single admin. No user accounts.
// Credentials come from env (set as secrets in Cloudflare dashboard),
// session state is a signed cookie (HMAC-SHA256) — no database involved.
import { NextRequest } from 'next/server'
import crypto from 'crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function secret(): string {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-insecure-secret'
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

export function verifyCredentials(email: string, password: string): boolean {
  const okEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const okPass = process.env.ADMIN_PASSWORD || ''
  if (!okPass) return false // no password configured -> refuse login
  const a = Buffer.from(email.toLowerCase().trim())
  const b = Buffer.from(okEmail.toLowerCase().trim())
  const emailOk = a.length === b.length && crypto.timingSafeEqual(a, b)
  const pa = Buffer.from(password)
  const pb = Buffer.from(okPass)
  const passOk = pa.length === pb.length && crypto.timingSafeEqual(pa, pb)
  return emailOk && passOk
}

export function createSessionValue(): string {
  const exp = Date.now() + MAX_AGE * 1000
  const payload = `admin.${exp}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionValue(value: string | undefined): boolean {
  if (!value) return false
  const parts = value.split('.')
  if (parts.length !== 3) return false
  const [who, exp, sig] = parts
  if (who !== 'admin') return false
  if (Number(exp) < Date.now()) return false
  const expected = sign(`${who}.${exp}`)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  }
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifySessionValue(req.cookies.get(COOKIE_NAME)?.value)
}

export function getAdminCookieName() { return COOKIE_NAME }
