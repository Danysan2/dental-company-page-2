import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
  getSession:     vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cita: {
      findMany:    vi.fn(),
      findFirst:   vi.fn(),
      findUnique:  vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      updateMany:  vi.fn(),
      count:       vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/google', () => ({
  agregarCitaSheets:       vi.fn(),
  actualizarCalendarEventId: vi.fn(),
  crearEventoCalendar:     vi.fn(),
}))

import { requireSession, getSession } from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { agregarCitaSheets, actualizarCalendarEventId, crearEventoCalendar } from '@/lib/google'
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
  id:             'c1',
  clienteId:      'cl1',
  servicioId:     'sv1',
  subServicioId:  null,
  fecha:          new Date('2026-06-10'),
  hora:           '09:00',
  horaFin:        null,
  estado:         'programada',
  notas:          null,
  precio:         120000,
  createdAt:      new Date(),
  cliente:        { id: 'cl1', nombre: 'Ana García', telefono: '3001234567', correo: 'ana@test.com', cedula: '1234567890' },
  servicio:       { id: 'sv1', nombre: 'Limpieza y Profilaxis', precio: 120000, duracion: 60 },
  subServicio:    null,
}

const mockSession = { id: 'u1', email: 'doc@test.com', nombre: 'Doc', rol: 'doctora' as const }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireSession).mockResolvedValue({ session: mockSession })
  vi.mocked(getSession).mockResolvedValue(mockSession)
  vi.mocked(prisma.cita.updateMany).mockResolvedValue({ count: 0 } as never)
  vi.mocked(prisma.cita.count).mockResolvedValue(0 as never)
  vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma))
  vi.mocked(agregarCitaSheets).mockResolvedValue(12)
  vi.mocked(crearEventoCalendar).mockResolvedValue('calendar-event-1')
  vi.mocked(actualizarCalendarEventId).mockResolvedValue(undefined)
})

// ── GET /api/citas ───────────────────────────────────────────
describe('GET /api/citas', () => {
  it('retorna 401 si no hay sesión', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireSession).mockResolvedValue(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
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
    expect(body[0].fecha).toBe('2026-06-10')
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
    fecha:      '2026-06-10',
    hora:       '09:00',
  }

  it('retorna 400 si falta clienteId', async () => {
    const res = await POST(makeReq('http://localhost/api/citas', { servicioId: 'sv1', fecha: '2026-06-10', hora: '09:00' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta servicioId', async () => {
    const res = await POST(makeReq('http://localhost/api/citas', { clienteId: 'cl1', fecha: '2026-06-10', hora: '09:00' }))
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
    expect(body.fecha).toBe('2026-06-10')
    expect(body.estado).toBe('programada')
  })

  it('crea una cita pública de consulta general y dispara sync con Google', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.cita.findFirst).mockResolvedValue(null)

    const consultaCita = {
      ...mockCita,
      servicioId: 'sv-consulta',
      precio: null,
      notas: 'Dolor al masticar',
      servicio: { id: 'sv-consulta', nombre: 'Consulta general - Valoración inicial', precio: 80000, duracion: 60 },
    }
    vi.mocked(prisma.cita.create).mockResolvedValue(consultaCita as never)

    const res = await POST(makeReq('http://localhost/api/citas', {
      clienteId:  'cl1',
      servicioId: 'sv-consulta',
      fecha:      '2026-06-10',
      hora:       '09:00',
      precio:     999999,
      notas:      'Dolor al masticar',
    }))

    expect(res.status).toBe(201)

    const createCall = vi.mocked(prisma.cita.create).mock.calls[0][0] as { data: Record<string, unknown> }
    expect(createCall.data.precio).toBeNull()
    expect(createCall.data.estado).toBe('programada')

    await vi.waitFor(() => {
      expect(agregarCitaSheets).toHaveBeenCalled()
      expect(crearEventoCalendar).toHaveBeenCalled()
      expect(actualizarCalendarEventId).toHaveBeenCalledWith(12, 'calendar-event-1')
    })

    expect(agregarCitaSheets).toHaveBeenCalledWith(expect.objectContaining({
      servicioId:     'sv-consulta',
      servicioNombre: 'Consulta general - Valoración inicial',
      precio:         80000,
      notas:          'Dolor al masticar',
    }))
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
