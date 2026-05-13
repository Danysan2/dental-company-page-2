export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma }            from '@/lib/prisma'
import { getSession, requireSession } from '@/lib/auth'
import { Unauthorized, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarFecha, validarHora, sanitizarTexto } from '@/lib/validators'
import { agregarCitaSheets, actualizarCalendarEventId, crearEventoCalendar } from '@/lib/google'

const VALID_ESTADOS = ['programada', 'completada', 'cancelada', 'no_asistio'] as const

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth
    const { session } = auth
    void session // session available if needed for future role checks

    const { searchParams } = new URL(req.url)
    const desde     = searchParams.get('desde')
    const hasta     = searchParams.get('hasta')
    const estado    = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')

    // Auto-completar citas programadas cuya fecha ya pasó
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    await prisma.cita.updateMany({
      where: { estado: 'programada', fecha: { lt: todayDate } },
      data:  { estado: 'completada' },
    })

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

    // Validate optional fields
    const estadoFinal = estado ?? 'programada'
    if (!VALID_ESTADOS.includes(estadoFinal)) return BadRequest('Estado inválido')
    if (precio !== undefined && precio !== null && (typeof precio !== 'number' || precio < 0)) {
      return BadRequest('Precio inválido')
    }
    const notasSanitizadas = notas ? sanitizarTexto(notas).slice(0, 500) : null

    // Rate limit: max 2 pending appointments per client
    const citasPendientes = await prisma.cita.count({
      where: { clienteId, estado: 'programada' },
    })
    if (citasPendientes >= 2) {
      return BadRequest('Ya tienes citas pendientes agendadas. Cancela una antes de agendar otra.')
    }

    // Check availability
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
        notas:  notasSanitizadas,
        precio: precio ?? null,
        estado: estadoFinal,
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
        servicio: { select: { id: true, nombre: true, precio: true, duracion: true } },
      },
    })

    // ── Sync con Google Sheets y Calendar (no bloquea si falla) ─────────────
    void (async () => {
      try {
        const citaData = {
          id:              cita.id,
          clienteId:       cita.clienteId,
          clienteTelefono: cita.cliente.telefono ?? '',
          clienteNombre:   cita.cliente.nombre,
          servicioId:      cita.servicioId,
          servicioNombre:  cita.servicio.nombre,
          precio:          cita.precio ?? cita.servicio.precio,
          fecha:           cita.fecha.toISOString().slice(0, 10),
          hora:            cita.hora,
          duracionMinutos: cita.servicio.duracion ?? 60,
          estado:          cita.estado,
          notas:           cita.notas,
          createdAt:       cita.createdAt,
        }

        const filaSheets = await agregarCitaSheets(citaData)

        const eventId = await crearEventoCalendar(citaData)

        if (filaSheets && eventId) {
          await actualizarCalendarEventId(filaSheets, eventId)
        }
      } catch (syncErr) {
        console.error('[POST /api/citas] Error en sync Google:', syncErr)
      }
    })()
    // ────────────────────────────────────────────────────────────────────────

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
