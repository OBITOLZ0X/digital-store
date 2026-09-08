import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { ProductForm } from '@/app/components/admin/product-form'

export const dynamic = 'force-dynamic'

export default function NewProductPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">New Product</h1>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0">
            <AdminMobileNav />
            <div className="mt-4"><ProductForm mode="new" /></div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
