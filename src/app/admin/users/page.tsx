import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import UsersClient from './users-client'

export const runtime = 'edge'


export default async function AdminUsersPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminDb = getServerSupabase()
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes((profile as {role:string}).role)) redirect('/')

  // Fetch all users with wallets (service_role bypasses RLS)
  const { data: profiles, error } = await adminDb
    .from('profiles')
    .select('id, email, full_name, role, is_verified, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">Users</h1>
          <div className="flex gap-8"><AdminSidebar /><div className="flex-1"><AdminMobileNav /><div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">Failed to load users: {error.message}</div></div></div>
        </div>
        <Footer />
      </div>
    )
  }

  const ids = (profiles || []).map(p => p.id)
  let walletsByUser: Record<string, { balance: number; is_frozen: boolean }> = {}
  if (ids.length > 0) {
    const { data: wallets } = await adminDb.from('wallets').select('user_id, balance, is_frozen').in('user_id', ids)
    for (const w of wallets || []) walletsByUser[w.user_id as string] = w as never
  }

  const users = (profiles || []).map(p => ({
    id: p.id as string,
    email: p.email as string,
    full_name: (p.full_name as string) || '',
    role: p.role as string,
    is_verified: p.is_verified as boolean,
    created_at: p.created_at as string,
    wallet: walletsByUser[p.id as string] || { balance: 0, is_frozen: false }
  }))

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Users <span className="text-sm font-normal text-zinc-500">({users.length})</span></h1>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-4">
            <AdminMobileNav />
            <UsersClient initialUsers={users} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}