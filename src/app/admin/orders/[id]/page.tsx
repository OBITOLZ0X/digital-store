import { Navbar, Footer } from '@/app/components/layout/navbar-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/ui'

export const runtime = 'edge'

export default async function DetailStub({ params }: { params: Promise<Record<string,string>> }){
  const p = await params
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-white mb-6">Detail {Object.values(p).join(' / ')}</h1>
        <Card><CardHeader><CardTitle>Detail view</CardTitle></CardHeader><CardContent className="text-sm text-zinc-400">Full detail with server actions. Configure Supabase to enable live data.</CardContent></Card>
      </div>
      <Footer />
    </div>
  )
}