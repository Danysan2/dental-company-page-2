export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/lib/prisma'
import { requireSession }            from '@/lib/auth'
import { NotFound, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarFecha, validarHora, validarUUID } from '@/lib/validators'
import {
  buscarFilaCitaSheets,
  actualizarCitaSheets,
  eliminarEventoCalendar,
  crearEventoCalendar,
} from '@/lib/google'

const VALID_ESTADOS = ['programada', 'completada', 'cancelada', 'no_asistio'] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const uuidErr = validarUUID(id)
    if (uuidErr) return BadRequest(uuidErr)

    const cita = await prisma.cita.findUnique({
      where:   { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const uuidErr = validarUUID(id)
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
      const current = await prisma.cita.findUnique({ where: { id } })
      if (!current) return NotFound('Cita no encontrada')

      const newFecha = fecha ? new Date(fecha) : current.fecha
      const newHora  = hora  ?? current.hora

      const conflict = await prisma.cita.findFirst({
        where: { fecha: newFecha, hora: newHora, estado: { not: 'cancelada' }, id: { not: id } },
      })
      if (conflict) return BadRequest('Ese horario ya está ocupado')
    }

    const cita = await prisma.cita.update({
      where: { id },
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
        servicio: { select: { id: true, nombre: true, precio: true, duracion: true } },
      },
    })

    // ── Sync Google (no bloquea si falla) ────────────────────────────────────
    void (async () => {
      try {
        const filaInfo = await buscarFilaCitaSheets(id)
        if (!filaInfo) return

        const esCancelacion = estado === 'cancelada'
        const esReagendamiento = !!(fecha || hora)

        if (esCancelacion) {
          // Actualizar estado en Sheets + eliminar evento en Calendar
          await actualizarCitaSheets(filaInfo.fila, { estado: 'cancelada' })
          if (filaInfo.calendarEventId) {
            await eliminarEventoCalendar(filaInfo.calendarEventId)
          }
        } else if (esReagendamiento) {
          // Eliminar evento viejo, crear nuevo, actualizar Sheets
          if (filaInfo.calendarEventId) {
            await eliminarEventoCalendar(filaInfo.calendarEventId)
          }

          const nuevaFecha = fecha ?? cita.fecha.toISOString().slice(0, 10)
          const nuevaHora  = hora  ?? cita.hora

          const nuevaData = {
            id,
            clienteId:       cita.clienteId,
            clienteTelefono: cita.cliente.telefono ?? '',
            clienteNombre:   cita.cliente.nombre,
            servicioId:      cita.servicioId,
            servicioNombre:  cita.servicio.nombre,
            precio:          cita.precio ?? cita.servicio.precio,
            fecha:           nuevaFecha,
            hora:            nuevaHora,
            duracionMinutos: cita.servicio.duracion ?? 60,
            estado:          cita.estado,
            notas:           cita.notas,
            createdAt:       cita.createdAt,
          }

          await actualizarCitaSheets(filaInfo.fila, {
            fecha:           nuevaFecha,
            hora:            nuevaHora,
            duracionMinutos: cita.servicio.duracion ?? 60,
          })

          const nuevoEventId = await crearEventoCalendar(nuevaData)
          if (nuevoEventId) {
            await actualizarCitaSheets(filaInfo.fila, { calendarEventId: nuevoEventId })
          } else {
            console.error('[PUT /api/citas/:id] crearEventoCalendar falló para cita.id:', id)
          }
        } else if (estado) {
          // Solo cambio de estado (ej: completada, no_asistio)
          await actualizarCitaSheets(filaInfo.fila, { estado })
        }
      } catch (syncErr) {
        console.error('[PUT /api/citas/:id] Error en sync Google:', syncErr)
      }
    })()
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json(cita)
  } catch (err) {
    console.error('[PUT /api/citas/:id]', err)
    return ServerError()
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const uuidErr = validarUUID(id)
    if (uuidErr) return BadRequest(uuidErr)

    await prisma.cita.update({
      where: { id },
      data:  { estado: 'cancelada' },
    })

    // ── Sync Google (no bloquea si falla) ────────────────────────────────────
    void (async () => {
      try {
        const filaInfo = await buscarFilaCitaSheets(id)
        if (!filaInfo) return
        await actualizarCitaSheets(filaInfo.fila, { estado: 'cancelada' })
        if (filaInfo.calendarEventId) {
          await eliminarEventoCalendar(filaInfo.calendarEventId)
        }
      } catch (syncErr) {
        console.error('[DELETE /api/citas/:id] Error en sync Google:', syncErr)
      }
    })()
    // ─────────────────────────────────────────────────────────────────────────

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/citas/:id]', err)
    return ServerError()
  }
}
