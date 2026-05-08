export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { ServerError }               from '@/lib/apiErrors'

const CHATBOT_URL = process.env.CHATBOT_URL ?? 'https://dentalbot.clouddec.site'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // precio must be integer for the chatbot API
    const payload = { ...body, precio: Math.round(Number(body.precio) || 0) }

    console.log('[POST /api/bot/citas] sending:', JSON.stringify(payload))

    const res  = await fetch(`${CHATBOT_URL}/api/citas`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    console.log(`[POST /api/bot/citas] chatbot responded ${res.status}:`, JSON.stringify(data))

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[POST /api/bot/citas]', err)
    return ServerError()
  }
}
