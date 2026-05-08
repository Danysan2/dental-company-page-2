export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { BadRequest, ServerError }   from '@/lib/apiErrors'

const CHATBOT_URL = process.env.CHATBOT_URL ?? 'https://dentalbot.clouddec.site'

export async function GET(req: NextRequest) {
  console.log('[GET /api/bot/disponibilidad] called')
  try {
    const { searchParams } = req.nextUrl
    const fecha            = searchParams.get('fecha')
    const duracion         = searchParams.get('duracion_minutos')

    console.log('[GET /api/bot/disponibilidad] fecha=', fecha, 'duracion=', duracion)

    if (!fecha || !duracion) {
      return BadRequest('fecha y duracion_minutos son requeridos')
    }

    const upstream = `${CHATBOT_URL}/api/disponibilidad?fecha=${encodeURIComponent(fecha)}&duracion_minutos=${encodeURIComponent(duracion)}`
    console.log('[GET /api/bot/disponibilidad] forwarding to', upstream)
    const res  = await fetch(upstream, { cache: 'no-store' })
    const data = await res.json()
    console.log(`[GET /api/bot/disponibilidad] chatbot responded ${res.status}:`, JSON.stringify(data))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[GET /api/bot/disponibilidad]', err)
    return ServerError()
  }
}
