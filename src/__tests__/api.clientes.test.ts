import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
    cita: {
      findMany: vi.fn(),
    },
  },
}))

import { requireSession } from '@/lib/auth'
import { prisma }      from '@/lib/prisma'
import { GET, POST }   from '@/app/api/clientes/route'

// ── Helpers ──────────────────────────────────────────────────
function makeReq(url = 'http://localhost/api/clientes', body?: object): NextRequest {
  if (body) {
    return new NextRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  return new NextRequest(url)
}

const mockClienteDB = {
  id:        'cl1',
  nombre:    'Ana García',
  cedula:    '1234567890',
  telefono:  '3001234567',
  correo:    'ana@test.com',
  notas:     null,
  activo:    true,
  createdAt: new Date('2025-01-15'),
  citas: [
    { estado: 'completada', precio: 120000 },
    { estado: 'completada', precio: 80000 },
    { estado: 'cancelada',  precio: null },
    { estado: 'programada', precio: null },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSession).mockResolvedValue({ session: { id: 'u1', email: 'doc@test.com', nombre: 'Doc', rol: 'doctora' } })
})

// ── GET /api/clientes ────────────────────────────────────────
describe('GET /api/clientes', () => {
  it('retorna 401 si no hay sesión', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireSession).mockResolvedValue(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('retorna lista enriquecida con stats agregadas', async () => {
    vi.mocked(prisma.cliente.findMany).mockResolvedValue([mockClienteDB] as never)
    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)

    const c = body[0]
    expect(c.id).toBe('cl1')
    expect(c.nombre).toBe('Ana García')
    expect(c.total_citas).toBe(4)
    expect(c.citas_completadas).toBe(2)
    expect(c.citas_canceladas).toBe(1)
    expect(c.citas_activas).toBe(1)
    expect(c.ingresos_generados).toBe(200000)
  })

  it('campo created_at proviene de createdAt de Prisma', async () => {
    vi.mocked(prisma.cliente.findMany).mockResolvedValue([mockClienteDB] as never)
    const body = await (await GET(makeReq())).json()
    expect(body[0].created_at).toBeDefined()
  })

  it('cliente sin citas tiene stats en 0', async () => {
    const sinCitas = { ...mockClienteDB, citas: [] }
    vi.mocked(prisma.cliente.findMany).mockResolvedValue([sinCitas] as never)
    const body = await (await GET(makeReq())).json()

    expect(body[0].total_citas).toBe(0)
    expect(body[0].ingresos_generados).toBe(0)
  })

  it('retorna 500 si prisma lanza error', async () => {
    vi.mocked(prisma.cliente.findMany).mockRejectedValue(new Error('DB down'))
    const res = await GET(makeReq())
    expect(res.status).toBe(500)
  })
})

// ── POST /api/clientes ───────────────────────────────────────
describe('POST /api/clientes', () => {
  const validBody = {
    nombre:   'Luis Pérez',
    cedula:   '1111111111',
    telefono: '3009876543',
    correo:   null,
  }

  it('retorna 400 si falta nombre', async () => {
    const res = await POST(makeReq('http://localhost/api/clientes', { cedula: '1111111111' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si la cédula tiene formato inválido', async () => {
    const res = await POST(makeReq('http://localhost/api/clientes', { ...validBody, cedula: 'abc' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si el teléfono tiene formato inválido', async () => {
    const res = await POST(makeReq('http://localhost/api/clientes', { ...validBody, telefono: '123' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si el correo es inválido', async () => {
    const res = await POST(makeReq('http://localhost/api/clientes', { ...validBody, correo: 'no-es-email' }))
    expect(res.status).toBe(400)
  })

  it('retorna cliente existente si la cédula ya existe (buscar-o-crear)', async () => {
    const existing = { id: 'cl-exist', nombre: 'Luis Antiguo', cedula: '1111111111' }
    vi.mocked(prisma.cliente.findUnique).mockResolvedValue(existing as never)

    const res  = await POST(makeReq('http://localhost/api/clientes', validBody))
    const body = await res.json()

    // No debe crear uno nuevo
    expect(prisma.cliente.create).not.toHaveBeenCalled()
    expect(body.id).toBe('cl-exist')
  })

  it('crea el cliente y retorna 201 si la cédula no existe', async () => {
    vi.mocked(prisma.cliente.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.cliente.create).mockResolvedValue({
      id: 'new1', nombre: 'Luis Pérez', cedula: '1111111111',
    } as never)

    const res  = await POST(makeReq('http://localhost/api/clientes', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.nombre).toBe('Luis Pérez')
    expect(prisma.cliente.create).toHaveBeenCalledOnce()
  })

  it('retorna 500 si prisma lanza error', async () => {
    vi.mocked(prisma.cliente.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.cliente.create).mockRejectedValue(new Error('DB error'))
    const res = await POST(makeReq('http://localhost/api/clientes', validBody))
    expect(res.status).toBe(500)
  })
})
