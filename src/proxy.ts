import { NextResponse, type NextRequest } from 'next/server'
import { isAdminRequest, getAdminCookieName } from '@/lib/auth'

// Gate /admin behind the signed admin cookie.
// (Next 16: this file convention is proxy.ts — middleware.ts is deprecated.)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !isAdminRequest(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

// keep the helper import used even if matcher changes
void getAdminCookieName
