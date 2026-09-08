// Public endpoint: increments the visit counter for a product.
// Used by client-side beacon so cached/CDN page views are still counted.
import { NextRequest, NextResponse } from 'next/server'
import { recordVisit, readVisits } from '@/lib/store'

export async function POST(req: NextRequest) {
  const { slug } = await req.json().catch(() => ({ slug: '' }))
  if (!slug || typeof slug !== 'string') return NextResponse.json({ error: 'slug required' }, { status: 400 })
  await recordVisit(slug)
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  const visits = await readVisits()
  return NextResponse.json({ slug, total: visits[slug]?.total || 0 })
}
