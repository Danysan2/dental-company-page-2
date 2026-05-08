import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cita: {
      findMany: vi.fn(),
    },
  },
}))

import { requireSession } from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { GET }        from '@/app/api/citas/disponibilidad/route'

// ── Helpers ──────────────────────────────────────────────────
function makeReq(url: string): NextRequest {
  return new NextRequest(url)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSession).mockResolvedValue({ session: { id: 'u1', email: 'doc@test.com', nombre: 'Doc', rol: 'doctora' } })
})

// ── GET /api/citas/disponibilidad ────────────────────────────
describe('GET /api/citas/disponibilidad', () => {
  it('retorna 401 si no hay sesión', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireSession).mockResolvedValue(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
    const res = await GET(makeReq('http://localhost/api/citas/disponibilidad?fecha=2026-05-10'))
    expect(res.status).toBe(401)
  })

  it('retorna 400 si falta el parámetro fecha', async () => {
    const res = await GET(makeReq('http://localhost/api/citas/disponibilidad'))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si la fecha tiene formato inválido', async () => {
    const res = await GET(makeReq('http://localhost/api/citas/disponibilidad?fecha=no-es-fecha'))
    expect(res.status).toBe(400)
  })

  it('retorna disponibles y ocupadas para una fecha sin citas', async () => {
    vi.mocked(prisma.cita.findMany).mockResolvedValue([] as never)
    const res  = await GET(makeReq('http://localhost/api/citas/disponibilidad?fecha=2026-05-10'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.fecha).toBe('2026-05-10')
    expect(Array.isArray(body.disponibles)).toBe(true)
    expect(Array.isArray(body.ocupadas)).toBe(true)
    expect(body.ocupadas).toHaveLength(0)
    // todos los HORARIOS están disponibles
    expect(body.disponibles).toHaveLength(10)
  })

  it('excluye de disponibles las horas ya ocupadas', async () => {
    vi.mocked(prisma.cita.findMany).mockResolvedValue([
      { hora: '09:00' },
      { hora: '10:00' },
    ] as never)
    const res  = await GET(makeReq('http://localhost/api/citas/disponibilidad?fecha=2026-05-10'))
    const body = await res.json()

    expect(body.ocupadas).toContain('09:00')
    expect(body.ocupadas).toContain('10:00')
    expect(body.disponibles).not.toContain('09:00')
    expect(body.disponibles).not.toContain('10:00')
    expect(body.disponibles).toHaveLength(8)
  })

  it('disponibles + ocupadas = todos los horarios (10)', async () => {
    vi.mocked(prisma.cita.findMany).mockResolvedValue([
      { hora: '08:00' },
      { hora: '11:00' },
      { hora: '14:00' },
    ] as never)
    const res  = await GET(makeReq('http://localhost/api/citas/disponibilidad?fecha=2026-05-10'))
    const body = await res.json()

    expect(body.disponibles.length + body.ocupadas.length).toBe(10)
  })

  it('la consulta a prisma excluye citas canceladas', async () => {
    vi.mocked(prisma.cita.findMany).mockResolvedValue([] as never)
    await GET(makeReq('http://localhost/api/citas/disponibilidad?fecha=2026-05-10'))
    const call = vi.mocked(prisma.cita.findMany).mock.calls[0][0] as { where: Record<string, unknown> }
    expect(call.where.estado).toEqual({ not: 'cancelada' })
  })

  it('retorna 500 si prisma lanza error', async () => {
    vi.mocked(prisma.cita.findMany).mockRejectedValue(new Error('DB down'))
    const res = await GET(makeReq('http://localhost/api/citas/disponibilidad?fecha=2026-05-10'))
    expect(res.status).toBe(500)
  })
})
