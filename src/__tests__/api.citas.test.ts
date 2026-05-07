import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cita: {
      findMany:    vi.fn(),
      findFirst:   vi.fn(),
      findUnique:  vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
    },
  },
}))

import { getSession } from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { GET, POST }  from '@/app/api/citas/route'

// ── Helpers ──────────────────────────────────────────────────
function makeReq(url = 'http://localhost/api/citas', body?: object): NextRequest {
  if (body) {
    return new NextRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  return new NextRequest(url)
}

const mockCita = {
  id:         'c1',
  clienteId:  'cl1',
  servicioId: 'sv1',
  fecha:      new Date('2026-05-10'),
  hora:       '09:00',
  estado:     'programada',
  notas:      null,
  precio:     120000,
  createdAt:  new Date(),
  cliente:    { id: 'cl1', nombre: 'Ana García', telefono: '3001234567', correo: 'ana@test.com', cedula: '1234567890' },
  servicio:   { id: 'sv1', nombre: 'Limpieza y Profilaxis', precio: 120000 },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSession).mockResolvedValue({ userId: 'u1', rol: 'doctora' } as ReturnType<typeof getSession> extends Promise<infer T> ? T : never)
})

// ── GET /api/citas ───────────────────────────────────────────
describe('GET /api/citas', () => {
  it('retorna 401 si no hay sesión', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('retorna lista plana de citas', async () => {
    vi.mocked(prisma.cita.findMany).mockResolvedValue([mockCita] as never)
    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].cliente_nombre).toBe('Ana García')
    expect(body[0].cliente_cedula).toBe('1234567890')
    expect(body[0].servicio).toBe('Limpieza y Profilaxis')
    expect(body[0].fecha).toBe('2026-05-10')
    expect(body[0].hora).toBe('09:00')
    expect(body[0].estado).toBe('programada')
  })

  it('aplica precio de la cita si está definido, sino el del servicio', async () => {
    const citaSinPrecio = { ...mockCita, precio: null }
    vi.mocked(prisma.cita.findMany).mockResolvedValue([citaSinPrecio] as never)
    const body = await (await GET(makeReq())).json()
    expect(body[0].precio).toBe(120000) // toma el del servicio
  })

  it('retorna 500 si prisma lanza error', async () => {
    vi.mocked(prisma.cita.findMany).mockRejectedValue(new Error('DB down'))
    const res = await GET(makeReq())
    expect(res.status).toBe(500)
  })

  it('filtra por estado via query param', async () => {
    vi.mocked(prisma.cita.findMany).mockResolvedValue([] as never)
    await GET(makeReq('http://localhost/api/citas?estado=completada'))
    const call = vi.mocked(prisma.cita.findMany).mock.calls[0][0] as { where: Record<string, unknown> }
    expect(call.where.estado).toBe('completada')
  })
})

// ── POST /api/citas ──────────────────────────────────────────
describe('POST /api/citas', () => {
  const validBody = {
    clienteId:  'cl1',
    servicioId: 'sv1',
    fecha:      '2026-05-10',
    hora:       '09:00',
  }

  it('retorna 400 si falta clienteId', async () => {
    const res = await POST(makeReq('http://localhost/api/citas', { servicioId: 'sv1', fecha: '2026-05-10', hora: '09:00' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta servicioId', async () => {
    const res = await POST(makeReq('http://localhost/api/citas', { clienteId: 'cl1', fecha: '2026-05-10', hora: '09:00' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si la fecha es inválida', async () => {
    const res = await POST(makeReq('http://localhost/api/citas', { ...validBody, fecha: 'no-es-fecha' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si la hora es inválida', async () => {
    const res = await POST(makeReq('http://localhost/api/citas', { ...validBody, hora: '9:00' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si el horario ya está ocupado', async () => {
    vi.mocked(prisma.cita.findFirst).mockResolvedValue(mockCita as never)
    const res = await POST(makeReq('http://localhost/api/citas', validBody))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('ocupado')
  })

  it('crea la cita y retorna 201 con shape plana', async () => {
    vi.mocked(prisma.cita.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.cita.create).mockResolvedValue(mockCita as never)

    const res  = await POST(makeReq('http://localhost/api/citas', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.cliente_nombre).toBe('Ana García')
    expect(body.servicio).toBe('Limpieza y Profilaxis')
    expect(body.fecha).toBe('2026-05-10')
    expect(body.estado).toBe('programada')
  })

  it('usa estado "programada" por defecto', async () => {
    vi.mocked(prisma.cita.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.cita.create).mockResolvedValue(mockCita as never)
    await POST(makeReq('http://localhost/api/citas', validBody))
    const call = vi.mocked(prisma.cita.create).mock.calls[0][0] as { data: Record<string, unknown> }
    expect(call.data.estado).toBe('programada')
  })

  it('retorna 500 si prisma lanza error', async () => {
    vi.mocked(prisma.cita.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.cita.create).mockRejectedValue(new Error('DB error'))
    const res = await POST(makeReq('http://localhost/api/citas', validBody))
    expect(res.status).toBe(500)
  })
})
