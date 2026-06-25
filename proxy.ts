import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname === '/' || pathname === '/login' || pathname === '/signup' ||
    pathname.startsWith('/_next/') ||    pathname.startsWith('/api/auth') || pathname.startsWith('/api/whatsapp') || pathname.startsWith('/api/diagnostic') || pathname.startsWith('/api/test-google') || pathname.startsWith('/api/auth-standalone') || pathname.startsWith('/favicon') ||
    pathname.startsWith('/images')
  ) {
    if ((pathname === '/login' || pathname === '/signup') && isLoggedIn(req)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn(req)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

function isLoggedIn(req: NextRequest): boolean {
  const token = req.cookies.get('authjs.session-token')?.value
  return !!token
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
