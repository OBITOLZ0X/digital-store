// Store images in KV (base64) — works everywhere (Node + Cloudflare Workers), no R2 needed.
// Images are small (<=5MB limit here → base64 ~6.7MB, KV value limit 25MB).
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getKv } from '@/lib/store'

const MAX = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'general'

  if (!file || file.size === 0) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, GIF allowed.' }, { status: 400 })
  if (file.size > MAX) return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.type.split('/')[1] || 'png'
  const key = `img:${folder}:${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const kv = await getKv()
  if (kv) {
    await kv.put(key, buffer.toString('base64'), { metadata: { type: file.type } })
    return NextResponse.json({ success: true, url: `/api/images/${key.slice(4)}` })
  }

  // Node host fallback: filesystem
  try {
    const fs = await import('fs')
    const path = await import('path')
    const dir = path.join(process.cwd(), 'data', 'uploads', folder)
    fs.mkdirSync(dir, { recursive: true })
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    fs.writeFileSync(path.join(dir, fileName), buffer)
    return NextResponse.json({ success: true, url: `/api/images/uploads/${folder}/${fileName}` })
  } catch (err) {
    return NextResponse.json({ error: 'Storage unavailable: ' + (err instanceof Error ? err.message : 'unknown') }, { status: 500 })
  }
}
