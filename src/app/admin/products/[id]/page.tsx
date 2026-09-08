import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { AdminSidebar, AdminMobileNav } from '@/app/components/layout/admin-layout'
import { ProductForm } from '@/app/components/admin/product-form'
import { getAdminProduct } from '@/app/admin/products/[id]/server'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getAdminProduct(id)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Product</h1>
        <div className="flex gap-8">
          <AdminSidebar />
          <div className="flex-1 min-w-0">
            <AdminMobileNav />
            <div className="mt-4">
              {product ? (
                <ProductForm
                  mode="edit"
                  initial={{
                    id: product.id,
                    name: product.name,
                    description: product.description || '',
                    short_description: product.short_description || '',
                    category_id: product.category_id || '',
                    image_url: product.image_url,
                    images: product.images || [],
                    price: String(product.variants?.length ? '' : product.price ?? ''),
                    compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
                    status: product.status,
                    is_featured: !!product.is_featured,
                    is_popular: !!product.is_popular,
                    has_variants: (product.variants?.length || 0) > 0,
                    variants: product.variants || [],
                    contact_channels: product.contact_channels || [],
                  }}
                />
              ) : (
                <p className="text-zinc-500">Product not found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
