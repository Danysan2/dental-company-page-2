export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma }          from '@/lib/prisma'
import { requireSession }  from '@/lib/auth'
import { BadRequest, ServerError } from '@/lib/apiErrors'
import { HORARIOS } from '@/lib/helpers'
import { validarFecha } from '@/lib/validators'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const fecha = searchParams.get('fecha')

    if (!fecha) return BadRequest('El parámetro fecha es requerido')
    const err = validarFecha(fecha)
    if (err) return BadRequest(err)

    const citasDelDia = await prisma.cita.findMany({
      where: {
        fecha:  new Date(fecha),
        estado: { not: 'cancelada' },
      },
      select: { hora: true },
    })

    const ocupadas = new Set(citasDelDia.map(c => c.hora))
    const disponibles = HORARIOS.filter(h => !ocupadas.has(h))

    return NextResponse.json({ fecha, disponibles, ocupadas: Array.from(ocupadas) })
  } catch (err) {
    console.error('[GET /api/citas/disponibilidad]', err)
    return ServerError()
  }
}
