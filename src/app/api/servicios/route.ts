export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServerError } from '@/lib/apiErrors'

export async function GET() {
  try {
    const servicios = await prisma.servicio.findMany({
      where:   { activo: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(servicios)
  } catch (err) {
    console.error('[GET /api/servicios]', err)
    return ServerError()
  }
}
