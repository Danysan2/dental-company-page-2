export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, setSessionCookie } from '@/lib/auth'
import { BadRequest, ServerError } from '@/lib/apiErrors'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return BadRequest('Correo y contraseña son requeridos')
    }

    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!staff || !staff.activo) {
      return BadRequest('Credenciales incorrectas')
    }

    const valid = await compare(password, staff.password)
    if (!valid) {
      return BadRequest('Credenciales incorrectas')
    }

    const token = await signToken({
      id:     staff.id,
      email:  staff.email,
      nombre: staff.nombre,
      rol:    staff.rol,
    })

    setSessionCookie(token)

    return NextResponse.json({
      user: {
        id:     staff.id,
        email:  staff.email,
        nombre: staff.nombre,
        rol:    staff.rol,
      },
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return ServerError()
  }
}
