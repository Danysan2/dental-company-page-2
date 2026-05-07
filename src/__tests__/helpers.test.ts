import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  HORARIOS,
  ESTADOS,
  formatCOP,
  today,
  startOfWeek,
  startOfMonth,
  daysAgo,
  daysFromNow,
  formatFecha,
  formatFechaLarga,
} from '@/lib/helpers'

// ── HORARIOS y ESTADOS ───────────────────────────────────────
describe('HORARIOS', () => {
  it('contiene 10 horarios desde 08:00 hasta 17:00', () => {
    expect(HORARIOS).toHaveLength(10)
    expect(HORARIOS[0]).toBe('08:00')
    expect(HORARIOS[9]).toBe('17:00')
  })

  it('todos los horarios tienen formato HH:MM', () => {
    HORARIOS.forEach(h => {
      expect(h).toMatch(/^\d{2}:\d{2}$/)
    })
  })
})

describe('ESTADOS', () => {
  it('contiene los 4 estados del esquema Prisma', () => {
    expect(ESTADOS).toEqual(['programada', 'completada', 'cancelada', 'no_asistio'])
  })
})

// ── formatCOP ────────────────────────────────────────────────
describe('formatCOP', () => {
  it('formatea cero como $ 0', () => {
    const result = formatCOP(0)
    expect(result).toContain('0')
  })

  it('formatea 120000 con símbolo de peso colombiano', () => {
    const result = formatCOP(120000)
    expect(result).toContain('120')
    expect(result).toMatch(/\$|COP/)
  })

  it('no incluye decimales', () => {
    const result = formatCOP(150000)
    expect(result).not.toMatch(/[.,]\d{2}$/)
  })

  it('formatea números grandes correctamente', () => {
    const result = formatCOP(1500000)
    expect(result).toContain('1')
    expect(result).toContain('500')
  })
})

// ── Funciones de fecha ───────────────────────────────────────
describe('today', () => {
  it('retorna la fecha actual en formato YYYY-MM-DD', () => {
    const result = today()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('coincide con la fecha real del sistema', () => {
    const expected = new Date().toISOString().split('T')[0]
    expect(today()).toBe(expected)
  })
})

describe('startOfWeek', () => {
  it('retorna una fecha en formato YYYY-MM-DD', () => {
    expect(startOfWeek()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('retorna el inicio de la semana (entre 6 días antes y hoy)', () => {
    const result = startOfWeek()
    // The returned date should be within the last 6 days
    const resultDate = new Date(result + 'T12:00:00Z')
    const todayDate  = new Date()
    const diffMs = todayDate.getTime() - resultDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThanOrEqual(0)
    expect(diffDays).toBeLessThan(7)
  })

  it('la fecha es <= today', () => {
    expect(startOfWeek() <= today()).toBe(true)
  })
})

describe('startOfMonth', () => {
  it('retorna una fecha en formato YYYY-MM-DD', () => {
    expect(startOfMonth()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('retorna el día 1 del mes actual', () => {
    const result = startOfMonth()
    expect(result.endsWith('-01')).toBe(true)
  })

  it('la fecha es <= today', () => {
    expect(startOfMonth() <= today()).toBe(true)
  })
})

describe('daysAgo', () => {
  it('retorna una fecha en formato YYYY-MM-DD', () => {
    expect(daysAgo(5)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('daysAgo(0) es igual a today', () => {
    expect(daysAgo(0)).toBe(today())
  })

  it('daysAgo(7) es 7 días antes de hoy', () => {
    const result = new Date(daysAgo(7) + 'T12:00:00')
    const expected = new Date()
    expected.setDate(expected.getDate() - 7)
    expect(result.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10))
  })

  it('daysAgo(n) siempre es menor que today', () => {
    expect(daysAgo(1) < today()).toBe(true)
  })
})

describe('daysFromNow', () => {
  it('retorna una fecha en formato YYYY-MM-DD', () => {
    expect(daysFromNow(3)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('daysFromNow(0) es igual a today', () => {
    expect(daysFromNow(0)).toBe(today())
  })

  it('daysFromNow(n) es mayor que today para n > 0', () => {
    expect(daysFromNow(1) > today()).toBe(true)
  })
})

// ── formatFecha ──────────────────────────────────────────────
describe('formatFecha', () => {
  it('convierte YYYY-MM-DD a DD/MM/YYYY', () => {
    expect(formatFecha('2026-05-06')).toBe('06/05/2026')
  })

  it('funciona para distintos meses y días', () => {
    expect(formatFecha('2025-12-01')).toBe('01/12/2025')
    expect(formatFecha('2026-01-31')).toBe('31/01/2026')
  })
})

// ── formatFechaLarga ─────────────────────────────────────────
describe('formatFechaLarga', () => {
  it('retorna una cadena no vacía', () => {
    const result = formatFechaLarga('2026-05-06')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('incluye el año', () => {
    expect(formatFechaLarga('2026-05-06')).toContain('2026')
  })
})
