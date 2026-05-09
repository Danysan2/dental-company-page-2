export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ServerError } from '@/lib/apiErrors'

const VALID_ACCIONES = ['crear', 'reagendar', 'cancelar'] as const

function unauthorized() {
  return NextResponse.json({ error: 'API key inválida' }, { status: 401 })
}

export async function POST(req: NextRequest) {
  try {
    // ── Autenticación por API key ─────────────────────────────────────────────
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      console.warn('[POST /api/sync/cita] API key inválida o ausente')
      return unauthorized()
    }

    const body = await req.json()
    const { accion, cliente_telefono, cliente_nombre, servicio_nombre,
            precio, fecha, hora_inicio, hora_anterior, fecha_anterior, notas } = body

    // ── Validación básica ─────────────────────────────────────────────────────
    if (!accion || !VALID_ACCIONES.includes(accion)) {
      return NextResponse.json({ error: 'accion inválida' }, { status: 400 })
    }
    if (!cliente_telefono || !fecha || !hora_inicio) {
      return NextResponse.json({ error: 'cliente_telefono, fecha y hora_inicio son requeridos' }, { status: 400 })
    }
    if (accion === 'reagendar' && (!hora_anterior || !fecha_anterior)) {
      return NextResponse.json({ error: 'hora_anterior y fecha_anterior son requeridos para reagendar' }, { status: 400 })
    }

    // ── Buscar cliente por teléfono (búsqueda flexible por sufijo) ────────────
    // El chatbot puede mandar "573123613840" y Postgres tener "3123613840" o viceversa
    const telLimpio = String(cliente_telefono).replace(/\D/g, '')
    const telSufijo = telLimpio.slice(-10) // últimos 10 dígitos

    let cliente = await prisma.cliente.findFirst({
      where: { telefono: { endsWith: telSufijo } },
    })

    if (!cliente) {
      const nombre = (cliente_nombre ?? 'Sin nombre').trim().slice(0, 100)
      cliente = await prisma.cliente.create({
        data: { nombre, telefono: cliente_telefono },
      })
      console.log('[sync/cita] Cliente creado:', cliente.id, cliente_telefono)
    }

    const fechaDate         = new Date(fecha)
    const fechaAnteriorDate = fecha_anterior ? new Date(fecha_anterior) : fechaDate

    // ── CREAR ─────────────────────────────────────────────────────────────────
    if (accion === 'crear') {
      // Buscar servicio por nombre (coincidencia parcial, case-insensitive)
      const servicio = servicio_nombre
        ? await prisma.servicio.findFirst({
            where: { nombre: { contains: servicio_nombre, mode: 'insensitive' } },
          })
        : null

      if (!servicio) {
        console.warn('[sync/cita] crear: servicio no encontrado:', servicio_nombre)
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 422 })
      }

      // Upsert: si ya existe una cita del mismo cliente en esa fecha+hora, no duplicar
      const existing = await prisma.cita.findFirst({
        where: { clienteId: cliente.id, fecha: fechaDate, hora: hora_inicio, estado: { not: 'cancelada' } },
      })

      if (existing) {
        console.log('[sync/cita] crear: cita ya existe, omitiendo duplicado:', existing.id)
        return NextResponse.json({ ok: true, citaId: existing.id, duplicado: true })
      }

      const cita = await prisma.cita.create({
        data: {
          clienteId:  cliente.id,
          servicioId: servicio.id,
          fecha:      fechaDate,
          hora:       hora_inicio,
          estado:     'programada',
          precio:     typeof precio === 'number' ? precio : null,
          notas:      notas ? String(notas).slice(0, 500) : null,
        },
      })

      console.log('[sync/cita] Cita creada en Postgres:', cita.id)
      return NextResponse.json({ ok: true, citaId: cita.id }, { status: 201 })
    }

    // ── REAGENDAR ─────────────────────────────────────────────────────────────
    if (accion === 'reagendar') {
      // Buscar por fecha+hora ANTERIORES (antes de la modificación)
      const cita = await prisma.cita.findFirst({
        where: {
          clienteId: cliente.id,
          fecha:     fechaAnteriorDate,
          hora:      hora_anterior,
          estado:    { not: 'cancelada' },
        },
      })

      if (!cita) {
        // No bloquear el chatbot — loguear y responder 200 para que el chatbot no reintente
        console.warn('[sync/cita] reagendar: cita no encontrada en Postgres para',
          cliente_telefono, fecha_anterior, hora_anterior, '— posible cliente con teléfono diferente o cita no sincronizada previamente')
        return NextResponse.json({ ok: true, advertencia: 'Cita no encontrada en Postgres — sync omitido' })
      }

      // Actualizar fecha Y hora (puede ser reagendamiento a otro día)
      await prisma.cita.update({
        where: { id: cita.id },
        data: { fecha: fechaDate, hora: hora_inicio },
      })

      console.log('[sync/cita] Cita reagendada:', cita.id,
        `${fecha_anterior} ${hora_anterior}`, '->', `${fecha} ${hora_inicio}`)
      return NextResponse.json({ ok: true, citaId: cita.id })
    }

    // ── CANCELAR ──────────────────────────────────────────────────────────────
    if (accion === 'cancelar') {
      const cita = await prisma.cita.findFirst({
        where: {
          clienteId: cliente.id,
          fecha:     fechaDate,
          hora:      hora_inicio,
          estado:    { not: 'cancelada' },
        },
      })

      if (!cita) {
        console.warn('[sync/cita] cancelar: cita no encontrada en Postgres para',
          cliente_telefono, fecha, hora_inicio, '— sync omitido')
        return NextResponse.json({ ok: true, advertencia: 'Cita no encontrada en Postgres — sync omitido' })
      }

      await prisma.cita.update({
        where: { id: cita.id },
        data: { estado: 'cancelada' },
      })

      console.log('[sync/cita] Cita cancelada:', cita.id)
      return NextResponse.json({ ok: true, citaId: cita.id })
    }

    return NextResponse.json({ error: 'accion no implementada' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/sync/cita]', err)
    return ServerError()
  }
}
