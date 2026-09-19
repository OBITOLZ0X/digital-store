import { cookies } from 'next/headers'
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from './index'

/**
 * Read the visitor's language: cookie first, then the admin-configured
 * default language, then 'en'.
 */
export async function getLang(): Promise<Lang> {
  try {
    const jar = await cookies()
    const v = jar.get(LANG_COOKIE)?.value
    if (isLang(v)) return v
  } catch {}
  try {
    const { readStore } = await import('@/lib/store')
    const settings = (await readStore()).settings as { defaultLang?: string } | undefined
    if (isLang(settings?.defaultLang)) return settings.defaultLang
  } catch {}
  return DEFAULT_LANG
}
