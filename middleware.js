import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Check for authentication here (token, session, etc.)
    // For now, this is a placeholder - add your auth logic
    const isAuthenticated = request.cookies.get('auth-token')?.value

    if (!isAuthenticated && pathname.startsWith('/admin')) {
      // Redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
