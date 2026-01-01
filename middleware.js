import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Protect admin routes (but allow login page)
  if (pathname.startsWith('/admin')) {
    // Allow /admin/login without authentication
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for authentication for all other admin pages
    const isAuthenticated = request.cookies.get('auth-token')?.value

    if (!isAuthenticated) {
      // Redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
