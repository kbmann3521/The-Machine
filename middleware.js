import { NextResponse } from 'next/server'

// Middleware is disabled - authentication is handled client-side via Supabase
export function middleware(request) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
