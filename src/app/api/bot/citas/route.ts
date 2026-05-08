export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { ServerError }               from '@/lib/apiErrors'

const CHATBOT_URL = process.env.CHATBOT_URL ?? 'https://dentalbot.clouddec.site'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(`${CHATBOT_URL}/api/citas`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[POST /api/bot/citas]', err)
    return ServerError()
  }
}
