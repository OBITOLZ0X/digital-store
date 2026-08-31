import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
export default async function AdminsPage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // service-role to avoid RLS recursion
  const adminDb = getServerSupabase()
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile as {role:string}).role !== 'super_admin') redirect('/admin')
  const { data: admins } = await supabase.from('profiles').select('id,email,full_name,role,created_at').in('role',['admin','super_admin'])
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Administrators</h1>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0">
            <AdminMobileNav />
            <Card>
              <CardHeader><CardTitle>Admin Users</CardTitle></CardHeader>
              <CardContent>
                {!admins?.length ? <p className="text-sm text-zinc-500">No admins found.</p> : (
                  <div className="space-y-2">
                    {(admins as {id:string;email:string;full_name:string|null;role:string}[]).map(a=>(
                      <div key={a.id} className="flex justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                        <div><div className="font-medium text-white text-sm">{a.email}</div><div className="text-xs text-zinc-500">{a.full_name||'—'} • {a.role}</div></div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-600 mt-4">Promote users via Supabase dashboard or update profiles.role to admin/super_admin.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
