import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Unauthorized, ServerError } from '@/lib/apiErrors'
import { today, startOfMonth, daysFromNow } from '@/lib/helpers'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Unauthorized()

    const [
      totalCitasHoy,
      citasMes,
      ingresosMes,
      citasProximas,
      distribEstados,
      topServicios,
    ] = await Promise.all([
      // Citas de hoy
      prisma.cita.count({
        where: {
          fecha:  new Date(today()),
          estado: { not: 'cancelada' },
        },
      }),

      // Citas del mes (no canceladas)
      prisma.cita.count({
        where: {
          fecha:  { gte: new Date(startOfMonth()) },
          estado: { not: 'cancelada' },
        },
      }),

      // Ingresos del mes (completadas)
      prisma.cita.aggregate({
        where: {
          fecha:  { gte: new Date(startOfMonth()) },
          estado: 'completada',
        },
        _sum: { precio: true },
      }),

      // Próximas 5 citas
      prisma.cita.findMany({
        where: {
          fecha:  { gte: new Date(today()), lte: new Date(daysFromNow(7)) },
          estado: 'programada',
        },
        include: {
          cliente:  { select: { nombre: true, telefono: true } },
          servicio: { select: { nombre: true } },
        },
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        take: 8,
      }),

      // Distribución por estado (mes actual)
      prisma.cita.groupBy({
        by: ['estado'],
        where: { fecha: { gte: new Date(startOfMonth()) } },
        _count: { estado: true },
      }),

      // Top 5 servicios del mes
      prisma.cita.groupBy({
        by: ['servicioId'],
        where: {
          fecha:  { gte: new Date(startOfMonth()) },
          estado: { not: 'cancelada' },
        },
        _count: { servicioId: true },
        orderBy: { _count: { servicioId: 'desc' } },
        take: 5,
      }),
    ])

    // Enriquecer top servicios con nombre
    const servicioIds = topServicios.map(s => s.servicioId)
    const servicios   = await prisma.servicio.findMany({
      where: { id: { in: servicioIds } },
      select: { id: true, nombre: true },
    })
    const servicioMap = Object.fromEntries(servicios.map(s => [s.id, s.nombre]))

    return NextResponse.json({
      kpis: {
        citasHoy:     totalCitasHoy,
        citasMes,
        ingresosMes:  ingresosMes._sum.precio ?? 0,
      },
      proximasCitas:   citasProximas,
      distribEstados:  distribEstados.map(e => ({
        estado: e.estado,
        total:  e._count.estado,
      })),
      topServicios:    topServicios.map(s => ({
        nombre: servicioMap[s.servicioId] ?? s.servicioId,
        total:  s._count.servicioId,
      })),
    })
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return ServerError()
  }
}
