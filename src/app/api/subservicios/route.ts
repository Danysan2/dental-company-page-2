export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServerError } from '@/lib/apiErrors'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const servicioId = searchParams.get('servicioId')

    const subServicios = await prisma.subServicio.findMany({
      where: {
        activo: true,
        ...(servicioId ? { servicioId } : {}),
      },
      select: { id: true, nombre: true, servicioId: true },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(subServicios)
  } catch (err) {
    console.error('[GET /api/subservicios]', err)
    return ServerError()
  }
}
