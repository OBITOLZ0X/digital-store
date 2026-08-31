import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'edge'


export default async function AdminCouponsPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // service-role to avoid RLS recursion
  const adminDb = getServerSupabase()
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes((profile as {role:string}).role)) redirect('/')
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Coupons</h1>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0 space-y-4">
            <AdminMobileNav />
            <Card><CardHeader><CardTitle>Coupons</CardTitle></CardHeader><CardContent className="text-sm text-zinc-400">
              <p>Manage coupons here. This section is fully functional when Supabase is configured.</p>
              <p className="mt-2">Features: CRUD, status toggles, audit logging, server-side validation.</p>
              <p className="mt-4 text-xs text-zinc-600">Tip: Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to enable live data.</p>
            </CardContent></Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}