export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireSession } from '@/lib/auth'
import { Unauthorized, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarNombre, validarCedula, validarTelefono, validarCorreo, sanitizarTexto } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    const clientes = await prisma.cliente.findMany({
      where: {
        activo: true,
        ...(q ? {
          OR: [
            { nombre:   { contains: q, mode: 'insensitive' } },
            { cedula:   { contains: q } },
            { telefono: { contains: q } },
            { correo:   { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        citas: {
          select: { estado: true, precio: true },
        },
      },
      orderBy: { nombre: 'asc' },
      take: 500,
    })

    // Enrich with aggregated stats matching original AdminClientes expectations
    const enriched = clientes.map(c => {
      const total_citas         = c.citas.length
      const citas_completadas   = c.citas.filter(x => x.estado === 'completada').length
      const citas_canceladas    = c.citas.filter(x => x.estado === 'cancelada').length
      const citas_activas       = c.citas.filter(x => x.estado === 'programada').length
      const ingresos_generados  = c.citas
        .filter(x => x.estado === 'completada')
        .reduce((s, x) => s + (x.precio ?? 0), 0)

      return {
        id:                c.id,
        nombre:            c.nombre,
        cedula:            c.cedula    ?? '',
        telefono:          c.telefono  ?? '',
        correo:            c.correo    ?? '',
        notas:             c.notas     ?? '',
        activo:            c.activo,
        created_at:        c.createdAt,
        total_citas,
        citas_completadas,
        citas_canceladas,
        citas_activas,
        ingresos_generados,
      }
    })

    return NextResponse.json(enriched)
  } catch (err) {
    console.error('[GET /api/clientes]', err)
    return ServerError()
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit para registros públicos: máx 15 por IP cada 15 min
    const staffSession = await getSession()
    if (!staffSession) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      if (!checkRateLimit(`clientes:${ip}`, 15, 15 * 60 * 1000)) {
        return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }, { status: 429 })
      }
    }

    // Allow both authed staff and anonymous public booking
    const body = await req.json()
    const nombre = sanitizarTexto(body.nombre ?? '')

    const errNombre = validarNombre(nombre)
    if (errNombre) return BadRequest(errNombre)

    const cedula   = body.cedula   ? sanitizarTexto(body.cedula)   : null
    const telefono = body.telefono ? sanitizarTexto(body.telefono) : null
    const correo   = body.correo   ? sanitizarTexto(body.correo).toLowerCase() : null

    const errCedula   = cedula   ? validarCedula(cedula)     : null
    const errTelefono = telefono ? validarTelefono(telefono) : null
    const errCorreo   = correo   ? validarCorreo(correo)     : null

    if (errCedula)   return BadRequest(errCedula)
    if (errTelefono) return BadRequest(errTelefono)
    if (errCorreo)   return BadRequest(errCorreo)

    // 1. Buscar por cédula (prioritario)
    if (cedula) {
      const existing = await prisma.cliente.findUnique({ where: { cedula } })
      if (existing) return NextResponse.json(existing)
    }

    // 2. Fallback: buscar por últimos 10 dígitos del teléfono
    //    El chatbot crea clientes sin cédula con formato "573XXXXXXXXXX".
    //    Si encontramos al cliente por teléfono, lo reutilizamos y opcionalmente
    //    le asignamos la cédula para evitar duplicados.
    if (telefono) {
      const telSufijo = telefono.replace(/\D/g, '').slice(-10)
      const byPhone = await prisma.cliente.findFirst({
        where: { telefono: { endsWith: telSufijo }, activo: true },
      })
      if (byPhone) {
        // Si el cliente no tenía cédula, actualizarla ahora que la tenemos
        if (cedula && !byPhone.cedula) {
          const updated = await prisma.cliente.update({
            where: { id: byPhone.id },
            data: { cedula },
          })
          return NextResponse.json(updated)
        }
        return NextResponse.json(byPhone)
      }
    }

    const cliente = await prisma.cliente.create({
      data: { nombre, cedula, telefono, correo, notas: body.notas ?? null },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clientes]', err)
    return ServerError()
  }
}
