export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Unauthorized, ServerError } from '@/lib/apiErrors'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()
    return NextResponse.json({ user: session })
  } catch (err) {
    console.error('[GET /api/auth/me]', err)
    return ServerError()
  }
}
