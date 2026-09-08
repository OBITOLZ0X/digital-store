import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { readVisits, readStore } from '@/lib/store'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [visits, store] = await Promise.all([readVisits(), readStore()])

  const products = store.products.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    views: visits[p.slug]?.total || 0,
    last7: last7(visits[p.slug]?.days || {}),
  }))

  products.sort((a, b) => b.views - a.views)

  const today = new Date().toISOString().slice(0, 10)
  const totals = {
    totalViews: products.reduce((s, p) => s + p.views, 0),
    todayViews: products.reduce((s, p) => s + (visits[p.slug]?.days?.[today] || 0), 0),
    products: store.products.length,
    categories: store.categories.length,
    contacts: store.contacts.length,
    days: last14Global(visits),
  }

  return NextResponse.json({ totals, products })
}

function last7(days: Record<string, number>): number[] {
  const out: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    out.push(days[d] || 0)
  }
  return out
}

function last14Global(visits: Record<string, { total: number; days: Record<string, number> }>): { day: string; views: number }[] {
  const agg: Record<string, number> = {}
  for (const rec of Object.values(visits)) {
    for (const [d, n] of Object.entries(rec.days || {})) agg[d] = (agg[d] || 0) + n
  }
  const out: { day: string; views: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    out.push({ day: d, views: agg[d] || 0 })
  }
  return out
}
