import { SignJWT, jwtVerify } from 'jose'
import { cookies }            from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-change-in-production'
)

const COOKIE_NAME = 'dental_session'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 horas

export interface SessionPayload {
  id: string
  email: string
  nombre: string
  rol: 'doctora' | 'recepcionista'
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch (err) {
    const preview = typeof token === 'string' ? token.slice(0, 20) : '?'
    console.error('[auth] verifyToken failed (token prefix:', preview + '…):', err)
    return null
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

/**
 * Use inside API route handlers to enforce authentication + optional role check.
 * Returns { session } on success, or a NextResponse (401/403) to return immediately.
 *
 * @example
 * const result = await requireSession()
 * if (result instanceof NextResponse) return result
 * const { session } = result
 */
export async function requireSession(
  requiredRol?: 'doctora' | 'recepcionista'
): Promise<{ session: SessionPayload } | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (requiredRol && session.rol !== requiredRol) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return { session }
}
