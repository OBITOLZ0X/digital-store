import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll(){ return cookieStore.getAll() }, setAll(cookiesToSet){ try{ cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options)) } catch{} } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function getProfile(userId: string) {
  const { supabase } = await getUser()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function requireAuth() {
  const { user } = await getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin() {
  const { user, supabase } = await getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes((profile as {role:string}).role)) throw new Error('Forbidden: Admin only')
  return { user, role: (profile as {role:string}).role }
}

export async function getWalletBalance(userId: string) {
  const { supabase } = await getUser()
  const { data } = await supabase.from('wallets').select('balance,currency,is_frozen').eq('user_id', userId).single()
  return data as { balance: number; currency: string; is_frozen: boolean } | null
}
