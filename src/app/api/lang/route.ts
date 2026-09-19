import { NextResponse } from 'next/server'
import { LANG_COOKIE, isLang } from '@/lib/i18n'

// Persist the visitor's language choice (1 year, whole site, same-site lax).
export async function POST(req: Request) {
  const { lang } = await req.json().catch(() => ({}))
  if (!isLang(lang)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const res = NextResponse.json({ ok: true, lang })
  res.cookies.set(LANG_COOKIE, lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  return res
}
