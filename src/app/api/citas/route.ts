export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Unauthorized, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarFecha, validarHora } from '@/lib/validators'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()

    const { searchParams } = new URL(req.url)
    const desde  = searchParams.get('desde')
    const hasta  = searchParams.get('hasta')
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')

    const where: Record<string, unknown> = {}
    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      }
    }
    if (estado) where.estado = estado
    if (clienteId) where.clienteId = clienteId

    const citas = await prisma.cita.findMany({
      where,
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true, correo: true } },
        servicio: { select: { id: true, nombre: true, precio: true, duracion: true } },
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      take: 500,
    })

    return NextResponse.json(citas)
  } catch (err) {
    console.error('[GET /api/citas]', err)
    return ServerError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()

    const body = await req.json()
    const { clienteId, servicioId, fecha, hora, notas, precio } = body

    if (!clienteId)           return BadRequest('clienteId es requerido')
    if (!servicioId)          return BadRequest('servicioId es requerido')
    const errFecha = validarFecha(fecha)
    if (errFecha)             return BadRequest(errFecha)
    const errHora = validarHora(hora)
    if (errHora)              return BadRequest(errHora)

    // Verificar disponibilidad
    const conflict = await prisma.cita.findFirst({
      where: { fecha: new Date(fecha), hora, estado: { not: 'cancelada' } },
    })
    if (conflict) return BadRequest('Ese horario ya está ocupado')

    const cita = await prisma.cita.create({
      data: {
        clienteId,
        servicioId,
        fecha:  new Date(fecha),
        hora,
        notas:  notas ?? null,
        precio: precio ?? null,
        estado: 'programada',
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true, correo: true } },
        servicio: { select: { id: true, nombre: true, precio: true, duracion: true } },
      },
    })

    return NextResponse.json(cita, { status: 201 })
  } catch (err) {
    console.error('[POST /api/citas]', err)
    return ServerError()
  }
}
