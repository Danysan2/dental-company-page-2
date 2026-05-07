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
    const desde     = searchParams.get('desde')
    const hasta     = searchParams.get('hasta')
    const estado    = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')

    const where: Record<string, unknown> = {}
    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      }
    }
    if (estado)    where.estado    = estado
    if (clienteId) where.clienteId = clienteId

    const citas = await prisma.cita.findMany({
      where,
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
        servicio: { select: { id: true, nombre: true, precio: true } },
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      take: 500,
    })

    // Flatten to match original AdminCitas expectations
    const flat = citas.map(c => ({
      id:               c.id,
      cliente_id:       c.clienteId,
      servicio_id:      c.servicioId,
      cliente_nombre:   c.cliente.nombre,
      cliente_cedula:   c.cliente.cedula  ?? '',
      cliente_telefono: c.cliente.telefono ?? '',
      cliente_correo:   c.cliente.correo  ?? '',
      servicio:         c.servicio.nombre,
      precio:           c.precio ?? c.servicio.precio,
      fecha:            c.fecha.toISOString().slice(0, 10),
      hora:             c.hora,
      estado:           c.estado,
      notas:            c.notas ?? '',
      createdAt:        c.createdAt,
    }))

    return NextResponse.json(flat)
  } catch (err) {
    console.error('[GET /api/citas]', err)
    return ServerError()
  }
}

export async function POST(req: NextRequest) {
  try {
    // Allow both authed staff and anonymous public booking
    const body = await req.json()
    const { clienteId, servicioId, fecha, hora, notas, precio, estado } = body

    if (!clienteId)  return BadRequest('clienteId es requerido')
    if (!servicioId) return BadRequest('servicioId es requerido')
    const errFecha = validarFecha(fecha)
    if (errFecha)    return BadRequest(errFecha)
    const errHora = validarHora(hora)
    if (errHora)     return BadRequest(errHora)

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
        notas:  notas  ?? null,
        precio: precio ?? null,
        estado: estado ?? 'programada',
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
        servicio: { select: { id: true, nombre: true, precio: true } },
      },
    })

    return NextResponse.json({
      id:               cita.id,
      cliente_id:       cita.clienteId,
      servicio_id:      cita.servicioId,
      cliente_nombre:   cita.cliente.nombre,
      cliente_cedula:   cita.cliente.cedula  ?? '',
      cliente_telefono: cita.cliente.telefono ?? '',
      servicio:         cita.servicio.nombre,
      precio:           cita.precio ?? cita.servicio.precio,
      fecha:            cita.fecha.toISOString().slice(0, 10),
      hora:             cita.hora,
      estado:           cita.estado,
      notas:            cita.notas ?? '',
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/citas]', err)
    return ServerError()
  }
}
