import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'


export async function POST(req: NextRequest){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(cookiesToSet){ try{ cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options)) } catch{} } }
  })
  await supabase.auth.signOut()
  const accept = req.headers.get('accept')||''
  if (accept.includes('text/html')) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.json({ success:true })
}
export async function GET(req: NextRequest){
  return POST(req)
}