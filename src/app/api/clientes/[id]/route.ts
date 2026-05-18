export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/lib/prisma'
import { requireSession }            from '@/lib/auth'
import { NotFound, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarNombre, validarCedula, validarTelefono, validarCorreo, validarUUID, sanitizarTexto } from '@/lib/validators'

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

    const cliente = await prisma.cliente.findUnique({
      where:   { id },
      include: {
        citas: {
          include: { servicio: { select: { nombre: true } } },
          orderBy: { fecha: 'desc' },
          take:    50,
        },
      },
    })

    if (!cliente) return NotFound('Cliente no encontrado')

    const historial = cliente.citas.map(c => ({
      id:       c.id,
      servicio: c.servicio.nombre,
      fecha:    c.fecha.toISOString().slice(0, 10),
      hora:     c.hora,
      estado:   c.estado,
      precio:   c.precio ?? 0,
    }))

    return NextResponse.json(historial)
  } catch (err) {
    console.error('[GET /api/clientes/:id]', err)
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

    const body   = await req.json()
    const nombre = sanitizarTexto(body.nombre ?? '')

    const errNombre = validarNombre(nombre)
    if (errNombre) return BadRequest(errNombre)

    const cedula   = body.cedula   ? sanitizarTexto(body.cedula)                  : null
    const telefono = body.telefono ? sanitizarTexto(body.telefono)                : null
    const correo   = body.correo   ? sanitizarTexto(body.correo).toLowerCase()    : null

    if (cedula   && validarCedula(cedula))     return BadRequest(validarCedula(cedula)!)
    if (telefono && validarTelefono(telefono)) return BadRequest(validarTelefono(telefono)!)
    if (correo   && validarCorreo(correo))     return BadRequest(validarCorreo(correo)!)

    const cliente = await prisma.cliente.update({
      where: { id },
      data:  { nombre, cedula, telefono, correo, notas: body.notas ?? null },
    })

    return NextResponse.json(cliente)
  } catch (err) {
    console.error('[PUT /api/clientes/:id]', err)
    return ServerError()
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only doctora can deactivate clients
    const auth = await requireSession('doctora')
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const uuidErr = validarUUID(id)
    if (uuidErr) return BadRequest(uuidErr)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.$transaction([
      // Cancelar citas futuras programadas del cliente
      prisma.cita.updateMany({
        where: { clienteId: id, estado: 'programada', fecha: { gte: today } },
        data: { estado: 'cancelada' },
      }),
      // Desactivar cliente
      prisma.cliente.update({
        where: { id },
        data: { activo: false },
      }),
    ])

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/clientes/:id]', err)
    return ServerError()
  }
}
