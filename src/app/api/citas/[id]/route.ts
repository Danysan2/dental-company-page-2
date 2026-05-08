export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/lib/prisma'
import { requireSession }            from '@/lib/auth'
import { NotFound, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarFecha, validarHora, validarUUID } from '@/lib/validators'

const VALID_ESTADOS = ['programada', 'completada', 'cancelada', 'no_asistio'] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const uuidErr = validarUUID(params.id)
    if (uuidErr) return BadRequest(uuidErr)

    const cita = await prisma.cita.findUnique({
      where:   { id: params.id },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
        servicio: { select: { id: true, nombre: true, precio: true } },
      },
    })

    if (!cita) return NotFound('Cita no encontrada')
    return NextResponse.json(cita)
  } catch (err) {
    console.error('[GET /api/citas/:id]', err)
    return ServerError()
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const uuidErr = validarUUID(params.id)
    if (uuidErr) return BadRequest(uuidErr)

    const body = await req.json()
    const { fecha, hora, estado, notas, precio, servicioId, clienteId } = body

    if (fecha) {
      const err = validarFecha(fecha)
      if (err) return BadRequest(err)
    }
    if (hora) {
      const err = validarHora(hora)
      if (err) return BadRequest(err)
    }
    if (estado && !VALID_ESTADOS.includes(estado)) {
      return BadRequest('Estado inválido')
    }
    if (precio !== undefined && (typeof precio !== 'number' || precio < 0)) {
      return BadRequest('Precio inválido')
    }

    // Check availability if date/time changes
    if (fecha || hora) {
      const current = await prisma.cita.findUnique({ where: { id: params.id } })
      if (!current) return NotFound('Cita no encontrada')

      const newFecha = fecha ? new Date(fecha) : current.fecha
      const newHora  = hora  ?? current.hora

      const conflict = await prisma.cita.findFirst({
        where: { fecha: newFecha, hora: newHora, estado: { not: 'cancelada' }, id: { not: params.id } },
      })
      if (conflict) return BadRequest('Ese horario ya está ocupado')
    }

    const cita = await prisma.cita.update({
      where: { id: params.id },
      data: {
        ...(fecha      ? { fecha: new Date(fecha) }         : {}),
        ...(hora       ? { hora }                            : {}),
        ...(estado     ? { estado }                          : {}),
        ...(notas      !== undefined ? { notas:  notas ?? null } : {}),
        ...(precio     !== undefined ? { precio: precio ?? null } : {}),
        ...(servicioId ? { servicioId }                     : {}),
        ...(clienteId  ? { clienteId }                      : {}),
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
        servicio: { select: { id: true, nombre: true, precio: true } },
      },
    })

    return NextResponse.json(cita)
  } catch (err) {
    console.error('[PUT /api/citas/:id]', err)
    return ServerError()
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const uuidErr = validarUUID(params.id)
    if (uuidErr) return BadRequest(uuidErr)

    await prisma.cita.update({
      where: { id: params.id },
      data:  { estado: 'cancelada' },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/citas/:id]', err)
    return ServerError()
  }
}
