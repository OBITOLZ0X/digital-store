// Serve images stored in KV (Cloudflare) or data/uploads (Node).
// On Node, static files in /data are not auto-served by Next, so we stream them here.
import { NextRequest, NextResponse } from 'next/server'
import { getKv } from '@/lib/store'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params

  // KV path: /api/images/<folder>/<filename> → KV key img:<folder>/<filename>
  if (key[0] !== 'uploads') {
    const fullKey = 'img:' + key.join('/')
    const kv = await getKv()
    if (kv) {
      const b64 = await kv.get(fullKey)
      if (!b64) return new NextResponse('Not found', { status: 404 })
      const meta = await kv.getWithMetadata(fullKey)
      const type = (meta.metadata as { type?: string } | null)?.type || 'image/png'
      return new NextResponse(Buffer.from(b64, 'base64'), {
        headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' },
      })
    }
    return new NextResponse('Not found', { status: 404 })
  }

  // Node filesystem path: /api/images/uploads/<folder>/<filename>
  try {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'uploads', ...key.slice(1))
    if (!fs.existsSync(filePath)) return new NextResponse('Not found', { status: 404 })
    const data = fs.readFileSync(filePath)
    const ext = key[key.length - 1]?.split('.').pop() || 'png'
    const types: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
    return new NextResponse(data, {
      headers: { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
