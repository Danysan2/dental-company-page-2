export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'
import { ServerError } from '@/lib/apiErrors'

export async function POST() {
  try {
    await clearSessionCookie()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/auth/logout]', err)
    return ServerError()
  }
}
