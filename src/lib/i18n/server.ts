import { cookies } from 'next/headers'
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from './index'

/** Read the visitor's language from the cookie (server-side). */
export async function getLang(): Promise<Lang> {
  try {
    const jar = await cookies()
    const v = jar.get(LANG_COOKIE)?.value
    if (isLang(v)) return v
  } catch {}
  return DEFAULT_LANG
}
