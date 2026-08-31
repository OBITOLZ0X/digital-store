import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AccountLayout } from '@/app/components/layout/account-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@/app/components/ui/ui'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'



export default async function ProfilePage(){
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const p = profile as { email:string; full_name:string|null; phone:string|null } | null
  const { data: wallet } = await supabase.from('wallets').select('balance,currency').eq('user_id', user.id).single()
  const role = (profile as {role:string}|null)?.role || 'customer'
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={{ id: user.id, email: user.email!, role }} balance={Number((wallet as {balance:number}|null)?.balance ?? 0)} currency={(wallet as {currency:string}|null)?.currency || 'DZD'} />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>
        <AccountLayout>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>Update your profile details</CardDescription></CardHeader>
              <CardContent>
                <form action="/api/account/profile" method="post" className="space-y-4">
                  <div><Label>Full Name</Label><Input name="full_name" defaultValue={p?.full_name||''} className="mt-1.5" /></div>
                  <div><Label>Email</Label><Input value={p?.email||user.email||''} disabled className="mt-1.5 opacity-60" /></div>
                  <div><Label>Phone</Label><Input name="phone" defaultValue={p?.phone||''} placeholder="+213 ..." className="mt-1.5" /></div>
                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
              <CardContent>
                <form action="/api/account/password" method="post" className="space-y-4">
                  <div><Label>New Password</Label><Input name="password" type="password" placeholder="Min 8 characters" required className="mt-1.5" /></div>
                  <Button type="submit" variant="outline">Update Password</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </AccountLayout>
      </div>
      <Footer />
    </div>
  )
}