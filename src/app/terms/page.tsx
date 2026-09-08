import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent } from '@/app/components/ui/ui'
import { TermsPage } from '../terms-privacy'

export default function Page(){
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <TermsPage />
      </div>
      <Footer />
    </div>
  )
}
