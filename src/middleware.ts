import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from './lib/auth'
import type { SessionPayload } from './lib/auth'

const PUBLIC_PATHS = ['/', '/sobre-nosotros', '/servicios', '/citas', '/login']
const API_PUBLIC   = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/servicios',
  '/api/citas/disponibilidad',
  '/api/sync/cita',
]

// POST-only public routes (public booking flow)
const API_PUBLIC_POST = ['/api/clientes', '/api/citas', '/api/email/cita']

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

  // Allow public booking POSTs (unauthenticated users creating citas/clientes)
  if (API_PUBLIC_POST.some(p => pathname === p) && req.method === 'POST') {
    return NextResponse.next()
  }

  // Protected: /admin/* and /api/* (except public)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    let session: SessionPayload | null = null
    try {
      session = await getSessionFromRequest(req)
    } catch (err) {
      console.error('[middleware] getSessionFromRequest threw:', err)
    }
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
