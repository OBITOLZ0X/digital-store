// YouTube URL parsing/validation — shared by admin APIs and the product page.
const ID_RE = /^[A-Za-z0-9_-]{11}$/

export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.split('/')[1] || ''
      return ID_RE.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'music.youtube.com' || host.endsWith('.youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && ID_RE.test(v)) return v
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/)
      if (m) return m[1]
    }
    return null
  } catch {
    return null
  }
}

/** Returns canonical watch URL, or null if not a valid YouTube video link. */
export function normalizeYouTubeUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  const id = parseYouTubeId(trimmed)
  return id ? `https://www.youtube.com/watch?v=${id}` : null
}
