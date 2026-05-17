export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/lib/prisma'
import { requireSession }            from '@/lib/auth'
import { NotFound, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarFecha, validarHora, validarUUID } from '@/lib/validators'
import {
  buscarFilaCitaSheets,
  buscarFilaCitaPorDatos,
  actualizarCitaSheets,
  eliminarEventoCalendar,
  crearEventoCalendar,
  type FilaCitaSheets,
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
    const { fecha, hora, horaFin, estado, notas, precio, servicioId, subServicioId, clienteId } = body

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

    // Fetch current cita (needed for availability check and Sheets fallback search)
    const current = await prisma.cita.findUnique({
      where: { id },
      include: {
        cliente: { select: { telefono: true } },
      },
    })
    if (!current) return NotFound('Cita no encontrada')

    // Check availability if date/time changes
    if (fecha || hora) {
      const newFecha = fecha ? new Date(fecha) : current.fecha
      const newHora  = hora  ?? current.hora

      const conflict = await prisma.cita.findFirst({
        where: { fecha: newFecha, hora: newHora, estado: { not: 'cancelada' }, id: { not: id } },
      })
      if (conflict) return BadRequest('Ese horario ya está ocupado')
    }

    // Save old fecha/hora for Sheets fallback search (before update)
    // Use UTC date parts directly to avoid timezone shift (dates stored as midnight UTC)
    const oldFecha = [
      current.fecha.getUTCFullYear(),
      String(current.fecha.getUTCMonth() + 1).padStart(2, '0'),
      String(current.fecha.getUTCDate()).padStart(2, '0'),
    ].join('-') // YYYY-MM-DD
    const oldHora  = current.hora
    const oldTelefono = current.cliente.telefono ?? ''

    const cita = await prisma.cita.update({
      where: { id },
      data: {
        ...(fecha           ? { fecha: new Date(fecha) }                 : {}),
        ...(hora            ? { hora }                                    : {}),
        ...(horaFin         !== undefined ? { horaFin: horaFin || null } : {}),
        ...(estado          ? { estado }                                  : {}),
        ...(notas           !== undefined ? { notas:  notas ?? null }     : {}),
        ...(precio          !== undefined ? { precio: precio ?? null }    : {}),
        ...(servicioId      ? { servicioId }                              : {}),
        ...(subServicioId   !== undefined ? { subServicioId: subServicioId || null } : {}),
        ...(clienteId       ? { clienteId }                              : {}),
      },
      include: {
        cliente:     { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
        servicio:    { select: { id: true, nombre: true, precio: true, duracion: true } },
        subServicio: { select: { id: true, nombre: true } },
      },
    })

    // ── Sync Google (no bloquea si falla) ────────────────────────────────────
    void (async () => {
      try {
        // Buscar por UUID primero, si no se encuentra buscar por tel+fecha+hora
        // (citas creadas por el chatbot tienen ID diferente en Sheets)
        let filaInfo: FilaCitaSheets | null = await buscarFilaCitaSheets(id)
        if (!filaInfo) {
          const [y, m, d] = oldFecha.split('-')
          const fechaSheets = `${d}/${m}/${y}` // DD/MM/YYYY
          filaInfo = await buscarFilaCitaPorDatos(oldTelefono, fechaSheets, oldHora)
        }
        if (!filaInfo) {
          console.warn('[PUT /api/citas/:id] Cita no encontrada en Sheets para sync:', id)
          return
        }

        const esCancelacion = estado === 'cancelada'
        const esReagendamiento = !!(fecha || hora)

        if (esCancelacion) {
          await actualizarCitaSheets(filaInfo.fila, { estado: 'cancelada' })
          if (filaInfo.calendarEventId) {
            await eliminarEventoCalendar(filaInfo.calendarEventId)
          }
        } else if (esReagendamiento) {
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
          }
        } else if (estado) {
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

    // Get current data before cancelling (for Sheets fallback search)
    const citaActual = await prisma.cita.findUnique({
      where: { id },
      include: { cliente: { select: { telefono: true } } },
    })
    if (!citaActual) return NotFound('Cita no encontrada')

    const delFecha = [
      citaActual.fecha.getUTCFullYear(),
      String(citaActual.fecha.getUTCMonth() + 1).padStart(2, '0'),
      String(citaActual.fecha.getUTCDate()).padStart(2, '0'),
    ].join('-') // YYYY-MM-DD
    const delHora  = citaActual.hora
    const delTel   = citaActual.cliente.telefono ?? ''

    await prisma.cita.update({
      where: { id },
      data:  { estado: 'cancelada' },
    })

    // ── Sync Google (no bloquea si falla) ────────────────────────────────────
    void (async () => {
      try {
        let filaInfo: FilaCitaSheets | null = await buscarFilaCitaSheets(id)
        if (!filaInfo) {
          const [y, m, d] = delFecha.split('-')
          const fechaSheets = `${d}/${m}/${y}`
          filaInfo = await buscarFilaCitaPorDatos(delTel, fechaSheets, delHora)
        }
        if (!filaInfo) {
          console.warn('[DELETE /api/citas/:id] Cita no encontrada en Sheets para sync:', id)
          return
        }
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
