import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'edge'

export async function POST(req: NextRequest){
  try{
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:'Unauthorized' }, {status:401})
    const form = await req.formData().catch(()=>null)
    let full_name: string | null = null, phone: string | null = null
    if (form) { full_name = String(form.get('full_name')||''); phone = String(form.get('phone')||'') }
    else { const j = await req.json(); full_name = j.full_name; phone = j.phone }
    const { error } = await supabase.from('profiles').update({ full_name, phone } as never).eq('id', user.id)
    if (error) throw error
    return NextResponse.json({ success:true })
  } catch(e){ return NextResponse.json({ error: e instanceof Error? e.message:'Failed' }, {status:500}) }
}