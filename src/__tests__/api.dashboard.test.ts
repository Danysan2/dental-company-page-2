import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: {
      count: vi.fn(),
    },
    cita: {
      count:     vi.fn(),
      aggregate: vi.fn(),
      findMany:  vi.fn(),
      groupBy:   vi.fn(),
    },
    servicio: {
      findMany: vi.fn(),
    },
  },
}))

import { requireSession } from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { GET }        from '@/app/api/dashboard/route'

// ── Setup helpers ────────────────────────────────────────────
function setupFullMocks() {
  vi.mocked(prisma.cliente.count).mockResolvedValue(25)
  vi.mocked(prisma.cita.count)
    .mockResolvedValueOnce(12)  // citas_este_mes
    .mockResolvedValueOnce(2)   // canceladas_este_mes
  vi.mocked(prisma.cita.aggregate).mockResolvedValue({
    _sum: { precio: 1500000 },
  } as never)
  vi.mocked(prisma.cita.findMany)
    .mockResolvedValueOnce([                // proximas
      {
        id:       'p1',
        fecha:    new Date('2026-05-10'),
        hora:     '09:00',
        estado:   'programada',
        cliente:  { nombre: 'Ana García' },
        servicio: { nombre: 'Limpieza y Profilaxis' },
      },
    ] as never)
    .mockResolvedValueOnce([                // citas_semana
      { fecha: new Date('2026-05-06'), estado: 'programada' },
      { fecha: new Date('2026-05-07'), estado: 'completada' },
    ] as never)
    .mockResolvedValueOnce([                // citas_meses
      { fecha: new Date('2026-04-01'), estado: 'completada', precio: 120000 },
      { fecha: new Date('2026-05-02'), estado: 'completada', precio: 80000 },
    ] as never)
  vi.mocked(prisma.cita.groupBy)
    .mockResolvedValueOnce([               // distribución estados
      { estado: 'programada', _count: { estado: 8 } },
      { estado: 'completada', _count: { estado: 10 } },
      { estado: 'cancelada',  _count: { estado: 2 } },
    ] as never)
    .mockResolvedValueOnce([               // top servicios
      { servicioId: 'sv1', _count: { servicioId: 15 } },
      { servicioId: 'sv2', _count: { servicioId: 8 } },
    ] as never)
  vi.mocked(prisma.servicio.findMany).mockResolvedValue([
    { id: 'sv1', nombre: 'Limpieza y Profilaxis' },
    { id: 'sv2', nombre: 'Blanqueamiento' },
  ] as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSession).mockResolvedValue({ session: { id: 'u1', email: 'doc@test.com', nombre: 'Doc', rol: 'doctora' } })
})

// ── GET /api/dashboard ───────────────────────────────────────
describe('GET /api/dashboard', () => {
  it('retorna 401 si no hay sesión', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireSession).mockResolvedValue(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna 200 con todas las secciones del dashboard', async () => {
    setupFullMocks()
    const res  = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('kpis')
    expect(body).toHaveProperty('proximas')
    expect(body).toHaveProperty('distribucion')
    expect(body).toHaveProperty('top_servicios')
    expect(body).toHaveProperty('citas_semana')
    expect(body).toHaveProperty('citas_meses')
  })

  it('kpis tienen los 4 campos esperados', async () => {
    setupFullMocks()
    const { kpis } = await (await GET()).json()

    expect(kpis.total_clientes).toBe(25)
    expect(kpis.citas_este_mes).toBe(12)
    expect(kpis.ingresos_este_mes).toBe(1500000)
    expect(kpis.canceladas_este_mes).toBe(2)
  })

  it('proximas tiene la shape plana correcta', async () => {
    setupFullMocks()
    const { proximas } = await (await GET()).json()

    expect(Array.isArray(proximas)).toBe(true)
    expect(proximas[0].cliente_nombre).toBe('Ana García')
    expect(proximas[0].servicio).toBe('Limpieza y Profilaxis')
    expect(proximas[0].fecha).toBe('2026-05-10')
    expect(proximas[0].hora).toBe('09:00')
    expect(proximas[0].estado).toBe('programada')
  })

  it('distribucion es un Record<estado, count>', async () => {
    setupFullMocks()
    const { distribucion } = await (await GET()).json()

    expect(distribucion.programada).toBe(8)
    expect(distribucion.completada).toBe(10)
    expect(distribucion.cancelada).toBe(2)
  })

  it('top_servicios tiene nombre resuelto y total', async () => {
    setupFullMocks()
    const { top_servicios } = await (await GET()).json()

    expect(top_servicios[0].nombre).toBe('Limpieza y Profilaxis')
    expect(top_servicios[0].total).toBe(15)
    expect(top_servicios[1].nombre).toBe('Blanqueamiento')
  })

  it('citas_semana tiene fecha como string ISO YYYY-MM-DD', async () => {
    setupFullMocks()
    const { citas_semana } = await (await GET()).json()

    expect(citas_semana[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(citas_semana[0].estado).toBe('programada')
  })

  it('citas_meses tiene fecha, estado y precio', async () => {
    setupFullMocks()
    const { citas_meses } = await (await GET()).json()

    expect(citas_meses[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(citas_meses[0].estado).toBe('completada')
    expect(typeof citas_meses[0].precio).toBe('number')
  })

  it('ingresos_este_mes es 0 si aggregate retorna null', async () => {
    setupFullMocks()
    vi.mocked(prisma.cita.aggregate).mockResolvedValue({ _sum: { precio: null } } as never)
    const { kpis } = await (await GET()).json()
    expect(kpis.ingresos_este_mes).toBe(0)
  })

  it('retorna 500 si prisma lanza error', async () => {
    vi.mocked(prisma.cliente.count).mockRejectedValue(new Error('DB down'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
