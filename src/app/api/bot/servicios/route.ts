export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { ServerError }  from '@/lib/apiErrors'

const CHATBOT_URL = process.env.CHATBOT_URL ?? 'https://dentalbot.clouddec.site'

export async function GET() {
  console.log('[GET /api/bot/servicios] called, forwarding to', CHATBOT_URL)
  try {
    const res  = await fetch(`${CHATBOT_URL}/api/servicios`, { cache: 'no-store' })
    const data = await res.json()
    console.log(`[GET /api/bot/servicios] chatbot responded ${res.status}, items=${Array.isArray(data) ? data.length : 'n/a'}`)
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[GET /api/bot/servicios]', err)
    return ServerError()
  }
}
