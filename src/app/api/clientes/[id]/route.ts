import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Unauthorized, NotFound, BadRequest, ServerError } from '@/lib/apiErrors'
import { validarNombre, validarCedula, validarTelefono, validarCorreo, sanitizarTexto } from '@/lib/validators'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        citas: {
          include: { servicio: true },
          orderBy: { fecha: 'desc' },
          take: 20,
        },
      },
    })

    if (!cliente) return NotFound('Cliente no encontrado')
    return NextResponse.json(cliente)
  } catch (err) {
    console.error('[GET /api/clientes/:id]', err)
    return ServerError()
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (cedula   && validarCedula(cedula))     return BadRequest(validarCedula(cedula)!)
    if (telefono && validarTelefono(telefono)) return BadRequest(validarTelefono(telefono)!)
    if (correo   && validarCorreo(correo))     return BadRequest(validarCorreo(correo)!)

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()

    await prisma.cliente.update({
      where: { id: params.id },
      data:  { activo: false },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/clientes/:id]', err)
    return ServerError()
  }
}
