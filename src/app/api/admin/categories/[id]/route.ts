import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server-client'

export const runtime = 'edge'


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const adminDb = getServerSupabase()

    const body = await req.json()
    const { name, slug, description, image_url, sort_order, is_active } = body

    if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })

    const { data, error } = await adminDb
      .from('categories')
      .update({
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('Categories PUT error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const adminDb = getServerSupabase()
    const { error } = await adminDb.from('categories').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Categories DELETE error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}