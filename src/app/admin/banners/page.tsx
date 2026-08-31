import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/ui'
export default function Stub(){ return (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Banners</h1>
      <div className="flex gap-8">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <AdminMobileNav />
          <Card><CardHeader><CardTitle>Homepage Banners</CardTitle></CardHeader><CardContent className="text-sm text-zinc-400">Upload hero banners, promo strips. Stored in Supabase Storage (banners bucket). Configure via store_settings.</CardContent></Card>
        </div>
      </div>
    </div>
    <Footer />
  </div>
)}
