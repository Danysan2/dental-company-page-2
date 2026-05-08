export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma }         from '@/lib/prisma'
import { requireSession } from '@/lib/auth'
import { ServerError }    from '@/lib/apiErrors'
import { today, startOfMonth, daysAgo } from '@/lib/helpers'

export async function GET() {
  try {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const todayStr    = today()
    const monthStart  = startOfMonth()
    const hace6meses  = (() => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - 5)
      return d.toISOString().slice(0, 10)
    })()
    const hace6dias = daysAgo(6)

    const [
      totalClientes,
      citasMes,
      ingresosMesAgg,
      canceladasMes,
      proximasCitas,
      distribEstados,
      topServicios,
      citasUltimos7dias,
      citasUltimos6meses,
    ] = await Promise.all([
      prisma.cliente.count({ where: { activo: true } }),

      prisma.cita.count({
        where: { fecha: { gte: new Date(monthStart) }, estado: { not: 'cancelada' } },
      }),

      prisma.cita.aggregate({
        where: { fecha: { gte: new Date(monthStart) }, estado: 'completada' },
        _sum: { precio: true },
      }),

      prisma.cita.count({
        where: { fecha: { gte: new Date(monthStart) }, estado: 'cancelada' },
      }),

      prisma.cita.findMany({
        where: {
          fecha:  { gte: new Date(todayStr) },
          estado: { not: 'cancelada' },
        },
        include: {
          cliente:  { select: { nombre: true } },
          servicio: { select: { nombre: true } },
        },
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        take: 6,
      }),

      prisma.cita.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),

      prisma.cita.groupBy({
        by: ['servicioId'],
        where: { estado: { not: 'cancelada' } },
        _count: { servicioId: true },
        orderBy: { _count: { servicioId: 'desc' } },
        take: 5,
      }),

      // Citas últimos 7 días (para bar chart semanal)
      prisma.cita.findMany({
        where: {
          fecha:  { gte: new Date(hace6dias), lte: new Date(todayStr) },
        },
        select: { fecha: true, estado: true },
      }),

      // Citas últimos 6 meses (para gráfico ingresos mensuales)
      prisma.cita.findMany({
        where: {
          fecha: { gte: new Date(hace6meses) },
        },
        select: { fecha: true, estado: true, precio: true },
      }),
    ])

    // Enriquecer top servicios con nombres
    const servicioIds = topServicios.map(s => s.servicioId)
    const servicios   = await prisma.servicio.findMany({
      where: { id: { in: servicioIds } },
      select: { id: true, nombre: true },
    })
    const servicioMap = Object.fromEntries(servicios.map(s => [s.id, s.nombre]))

    // Distribución de estados (map to original shape)
    const distribMap: Record<string, number> = {}
    distribEstados.forEach(e => { distribMap[e.estado] = e._count.estado })

    return NextResponse.json({
      kpis: {
        total_clientes:      totalClientes,
        citas_este_mes:      citasMes,
        ingresos_este_mes:   ingresosMesAgg._sum.precio ?? 0,
        canceladas_este_mes: canceladasMes,
      },
      proximas: proximasCitas.map(c => ({
        id:             c.id,
        cliente_nombre: c.cliente.nombre,
        servicio:       c.servicio.nombre,
        fecha:          c.fecha.toISOString().slice(0, 10),
        hora:           c.hora,
        estado:         c.estado,
      })),
      distribucion: distribMap,
      top_servicios: topServicios.map(s => ({
        nombre: servicioMap[s.servicioId] ?? s.servicioId,
        total:  s._count.servicioId,
      })),
      citas_semana: citasUltimos7dias.map(c => ({
        fecha:  c.fecha.toISOString().slice(0, 10),
        estado: c.estado,
      })),
      citas_meses: citasUltimos6meses.map(c => ({
        fecha:  c.fecha.toISOString().slice(0, 10),
        estado: c.estado,
        precio: c.precio ?? 0,
      })),
    })
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return ServerError()
  }
}
