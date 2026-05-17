export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma }            from '@/lib/prisma'
import { getSession, requireSession } from '@/lib/auth'
import { Unauthorized, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarFecha, validarHora, sanitizarTexto } from '@/lib/validators'
import { agregarCitaSheets, actualizarCalendarEventId, crearEventoCalendar } from '@/lib/google'
import { checkRateLimit } from '@/lib/rateLimit'

const VALID_ESTADOS = ['programada', 'completada', 'cancelada', 'no_asistio'] as const

// Throttle del auto-complete: solo corre una vez por hora por instancia del servidor
let lastAutoCompleteMs = 0
const AUTO_COMPLETE_INTERVAL_MS = 60 * 60 * 1000 // 1 hora

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

    // Auto-completar citas programadas cuya fecha ya pasó (máximo una vez por hora)
    const now = Date.now()
    if (now - lastAutoCompleteMs > AUTO_COMPLETE_INTERVAL_MS) {
      lastAutoCompleteMs = now
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      await prisma.cita.updateMany({
        where: { estado: 'programada', fecha: { lt: todayDate } },
        data:  { estado: 'completada' },
      })
    }

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
        cliente:     { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
        servicio:    { select: { id: true, nombre: true, precio: true } },
        subServicio: { select: { id: true, nombre: true } },
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      take: 500,
    })

    // Flatten to match original AdminCitas expectations
    const flat = citas.map(c => ({
      id:                 c.id,
      cliente_id:         c.clienteId,
      servicio_id:        c.servicioId,
      sub_servicio_id:    c.subServicioId ?? '',
      cliente_nombre:     c.cliente.nombre,
      cliente_cedula:     c.cliente.cedula    ?? '',
      cliente_telefono:   c.cliente.telefono  ?? '',
      cliente_correo:     c.cliente.correo    ?? '',
      servicio:           c.servicio.nombre,
      sub_servicio:       c.subServicio?.nombre ?? '',
      precio:             c.precio ?? c.servicio.precio,
      fecha:              c.fecha.toISOString().slice(0, 10),
      hora:               c.hora,
      hora_fin:           c.horaFin ?? '',
      estado:             c.estado,
      notas:              c.notas ?? '',
      createdAt:          c.createdAt,
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
    const { clienteId, servicioId, subServicioId, fecha, hora, horaFin, notas, precio, estado } = body

    if (!clienteId)  return BadRequest('clienteId es requerido')
    if (!servicioId) return BadRequest('servicioId es requerido')
    const errFecha = validarFecha(fecha)
    if (errFecha)    return BadRequest(errFecha)
    const errHora = validarHora(hora)
    if (errHora)     return BadRequest(errHora)

    // Rate limit para reservas públicas: máx 15 por IP cada 15 min
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const session = await getSession()
    if (!session && !checkRateLimit(`citas:${ip}`, 15, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }, { status: 429 })
    }

    // Si el usuario no está autenticado (reserva pública), forzar estado y precio seguros
    const esStaff = !!session
    const estadoFinal = esStaff ? (estado ?? 'programada') : 'programada'
    if (esStaff && !VALID_ESTADOS.includes(estadoFinal)) return BadRequest('Estado inválido')
    const precioFinal = esStaff ? (precio ?? null) : null
    if (esStaff && precio !== undefined && precio !== null && (typeof precio !== 'number' || precio < 0)) {
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

    // Verificar disponibilidad y crear en una transacción atómica para evitar doble-booking
    const fechaDate = new Date(fecha)
    let cita
    try {
      cita = await prisma.$transaction(async (tx) => {
        const conflict = await tx.cita.findFirst({
          where: { fecha: fechaDate, hora, estado: { not: 'cancelada' } },
        })
        if (conflict) throw new Error('HORARIO_OCUPADO')

        return tx.cita.create({
          data: {
            clienteId,
            servicioId,
            ...(subServicioId ? { subServicioId } : {}),
            fecha:  fechaDate,
            hora,
            ...(horaFin ? { horaFin } : {}),
            notas:  notasSanitizadas,
            precio: precioFinal,
            estado: estadoFinal,
          },
          include: {
            cliente:     { select: { id: true, nombre: true, telefono: true, correo: true, cedula: true } },
            servicio:    { select: { id: true, nombre: true, precio: true, duracion: true } },
            subServicio: { select: { id: true, nombre: true } },
          },
        })
      })
    } catch (txErr) {
      if ((txErr as Error).message === 'HORARIO_OCUPADO') {
        return BadRequest('Ese horario ya está ocupado')
      }
      throw txErr
    }

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
      sub_servicio_id:  cita.subServicioId ?? '',
      cliente_nombre:   cita.cliente.nombre,
      cliente_cedula:   cita.cliente.cedula  ?? '',
      cliente_telefono: cita.cliente.telefono ?? '',
      servicio:         cita.servicio.nombre,
      sub_servicio:     cita.subServicio?.nombre ?? '',
      precio:           cita.precio ?? cita.servicio.precio,
      fecha:            cita.fecha.toISOString().slice(0, 10),
      hora:             cita.hora,
      hora_fin:         cita.horaFin ?? '',
      estado:           cita.estado,
      notas:            cita.notas ?? '',
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/citas]', err)
    return ServerError()
  }
}
