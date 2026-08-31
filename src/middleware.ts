import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Skip if Supabase not configured (allow dev without env)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAccountRoute = pathname.startsWith('/account')
  const isAdminRoute = pathname.startsWith('/admin')

  if ((isAccountRoute || isAdminRoute) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAdminRoute && user) {
    // Use anon first, fallback to service-role to avoid RLS recursion
    let role: string | null = null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = (profile as { role: string } | null)?.role ?? null
    if (!role) {
      // Fallback: service-role bypasses RLS (fixes "infinite recursion" policy)
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const adminDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data: p2 } = await adminDb.from('profiles').select('role').eq('id', user.id).single()
        role = (p2 as { role: string } | null)?.role ?? null
      } catch {}
    }
    if (!role || !['admin', 'super_admin'].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
}
