import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from './lib/auth'

const PUBLIC_PATHS = ['/', '/nosotros', '/servicios', '/citas', '/contacto', '/login']
const API_PUBLIC   = ['/api/auth/login', '/api/auth/logout']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static files
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|svg|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next()
  }

  // Allow public API routes
  if (API_PUBLIC.some(p => pathname === p)) {
    return NextResponse.next()
  }

  // Protected: /admin/* and /api/* (except public)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    const session = await getSessionFromRequest(req)
    if (!session) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
