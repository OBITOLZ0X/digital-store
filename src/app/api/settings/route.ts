import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server-client'

export const runtime = 'edge'


// Public — no auth, only exposes safe keys
export async function GET() {
  const db = getServerSupabase()
  const { data } = await db.from('store_settings').select('key, value').in('key', ['reviews_enabled'])
  const map: Record<string,string> = {}
  for(const r of (data||[]) as {key:string,value:string|null}[]) map[r.key]=r.value||''
  // default disabled if not set
  if(!('reviews_enabled' in map)) map['reviews_enabled']='false'
  return NextResponse.json(map, { headers: { 'Cache-Control': 'no-store' } })
}