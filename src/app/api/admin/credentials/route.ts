// Change admin login email / password. Writes to .env.local on self-hosted Node,
// or instructs the admin to update Cloudflare env secrets when RUNNING_ON=cloudflare.
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isAdminRequest, verifyCredentials } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    email: process.env.ADMIN_EMAIL || '',
    platform: process.env.RUNNING_ON === 'cloudflare' ? 'cloudflare' : 'self-hosted',
    // never return the password
  })
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { current_password, new_email, new_password } = body as {
    current_password?: string; new_email?: string; new_password?: string
  }

  // Require re-auth with the current password for any change
  if (!current_password || !verifyCredentials(process.env.ADMIN_EMAIL || '', String(current_password))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })
  }

  const email = String(new_email || '').trim().toLowerCase()
  const password = String(new_password || '')
  if (new_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }
  if (new_password && password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!new_email && !new_password) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  if (process.env.RUNNING_ON === 'cloudflare') {
    // Cannot write env vars from inside a worker — surface instructions
    return NextResponse.json({
      success: false,
      managed: 'cloudflare',
      message: 'On Cloudflare, change ADMIN_EMAIL / ADMIN_PASSWORD in your Worker Settings → Variables (Secrets), then redeploy. The login here reads them live.',
    })
  }

  try {
    const envPath = path.join(process.cwd(), '.env.local')
    let lines: string[] = []
    if (fs.existsSync(envPath)) {
      lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    }
    function upsert(key: string, value: string) {
      const idx = lines.findIndex(l => l.startsWith(key + '='))
      const line = `${key}=${value}`
      if (idx >= 0) lines[idx] = line
      else lines.push(line)
    }
    if (new_email) upsert('ADMIN_EMAIL', email)
    if (new_password) upsert('ADMIN_PASSWORD', password)
    fs.writeFileSync(envPath, lines.filter(l => l.trim() !== '').join('\n') + '\n', 'utf8')
    return NextResponse.json({
      success: true,
      note: 'Saved to .env.local. Restart the server (or redeploy) for the new credentials to take effect.',
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to write credentials: ' + (err instanceof Error ? err.message : 'unknown') }, { status: 500 })
  }
}
