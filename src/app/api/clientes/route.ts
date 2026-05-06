export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Unauthorized, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarNombre, validarCedula, validarTelefono, validarCorreo, sanitizarTexto } from '@/lib/validators'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    const clientes = await prisma.cliente.findMany({
      where: {
        activo: true,
        ...(q ? {
          OR: [
            { nombre:  { contains: q, mode: 'insensitive' } },
            { cedula:  { contains: q } },
            { telefono:{ contains: q } },
            { correo:  { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { nombre: 'asc' },
      take: 100,
    })

    return NextResponse.json(clientes)
  } catch (err) {
    console.error('[GET /api/clientes]', err)
    return ServerError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()

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

    // buscar o crear por cédula
    if (cedula) {
      const existing = await prisma.cliente.findUnique({ where: { cedula } })
      if (existing) return NextResponse.json(existing)
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
