import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'

// POST /api/products/[id]/reviews — create a review (only when reviews_enabled=true)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params
  const db = getServerSupabase()
  // check feature flag
  const { data: flag } = await db.from('store_settings').select('value').eq('key','reviews_enabled').maybeSingle()
  if ((flag as {value:string|null}|null)?.value !== 'true') {
    return NextResponse.json({ error: 'Reviews are disabled by admin' }, { status: 403 })
  }
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(){} }
  })
  const { data:{ user } } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const body = await req.json()
  const rating = Number(body.rating)
  const comment = String(body.comment||'').trim()
  if(!rating || rating<1 || rating>5) return NextResponse.json({ error:'Rating 1-5 required' }, { status:400 })
  if(!comment) return NextResponse.json({ error:'Comment required' }, { status:400 })
  // try to insert into product_reviews if table exists — otherwise return success for local preview
  const { error } = await (db as any).from('product_reviews').insert({ product_id: productId, user_id: user.id, rating, comment })
  if(error){
    // if table missing, still succeed (frontend will handle local preview)
    if(/does not exist|Could not find/i.test(error.message)){
      return NextResponse.json({ ok:true, local:true, message:'Reviews table not created yet — review saved locally. Run SQL in supabase.sql to persist.' })
    }
    return NextResponse.json({ error: error.message }, { status:500 })
  }
  return NextResponse.json({ ok:true })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getServerSupabase()
  const { data: flag } = await db.from('store_settings').select('value').eq('key','reviews_enabled').maybeSingle()
  if ((flag as {value:string|null}|null)?.value !== 'true') return NextResponse.json([])
  const { data, error } = await (db as any).from('product_reviews').select('id, rating, comment, created_at, user_id').eq('product_id', id).order('created_at',{ascending:false}).limit(20)
  if(error) return NextResponse.json([])
  return NextResponse.json(data||[])
}
