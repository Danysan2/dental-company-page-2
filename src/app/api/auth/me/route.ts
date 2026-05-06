export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Unauthorized } from '@/lib/apiErrors'

export async function GET() {
  const session = await getSession()
  if (!session) return Unauthorized()
  return NextResponse.json({ user: session })
}
