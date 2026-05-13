'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { formatCOP, today } from '@/lib/helpers'
import Skeleton from '@/components/ui/Skeleton'
import './AdminDashboard.css'

/* ── SVG Bar Chart ── */
function BarChart({ data, color = '#896646' }: { data: { label: string; value: number; today: boolean }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const H = 120

  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const pct  = d.value / max
        const barH = Math.max(pct * H, d.value > 0 ? 4 : 0)
        return (
          <div key={i} className="bar-chart__col">
            <div className="bar-chart__val">{d.value > 0 ? d.value : ''}</div>
            <div className="bar-chart__bar-wrap" style={{ height: H }}>
              <div
                className="bar-chart__bar"
                style={{
                  height: barH,
                  background: d.today
                    ? `linear-gradient(to top, ${color}, #B1906F)`
                    : `${color}55`,
                  border: d.today ? `1.5px solid ${color}` : 'none',
                }}
                title={`${d.label}: ${d.value} citas`}
              />
            </div>
            <div className="bar-chart__label">{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── SVG Donut Chart ── */
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (total === 0) return <div className="donut-empty">Sin datos</div>

  const R = 60, CX = 70, CY = 70
  const circumference = 2 * Math.PI * R
  let offset = 0

  const arcs = slices.map((s) => {
    const pct  = s.value / total
    const dash = pct * circumference
    const arc  = { ...s, offset, dash, pct }
    offset += dash
    return arc
  })

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 140 140" className="donut-chart__svg">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth="22"
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${CX} ${CY})`}
            opacity="0.88"
          />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="18" fontFamily="Cormorant Garamond, serif" fill="#3D3C3B" fontWeight="300">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="8" fontFamily="Poppins, sans-serif" fill="#8a8784" letterSpacing="1">TOTAL</text>
      </svg>
      <ul className="donut-chart__legend">
        {arcs.map((arc, i) => (
          <li key={i}>
            <span className="donut-chart__dot" style={{ background: arc.color }} />
            <span className="donut-chart__legend-label">{arc.label}</span>
            <span className="donut-chart__legend-val">
              {arc.value} <em>({Math.round(arc.pct * 100)}%)</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Skeleton components ── */
function KpiSkeleton() {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Skeleton width={80} height={13} />
        <Skeleton width={44} height={44} circle />
      </div>
      <Skeleton width={90} height={32} style={{ marginTop: '0.25rem' }} />
      <Skeleton width={70} height={12} radius={99} />
    </div>
  )
}

function ChartSkeleton({ height = 120 }: { height?: number }) {
  return <Skeleton height={height} />
}

function UpcomingSkeleton() {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div key={i} className="upcoming-item">
          <Skeleton width={38} height={38} circle />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Skeleton width="55%" height={13} />
            <Skeleton width="40%" height={11} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
            <Skeleton width={48} height={11} />
            <Skeleton width={36} height={11} />
          </div>
          <Skeleton width={72} height={22} radius={99} />
        </div>
      ))}
    </>
  )
}

/* ── Types ── */
interface DashboardData {
  kpis: {
    total_clientes: number
    citas_este_mes: number
    ingresos_este_mes: number
    canceladas_este_mes: number
  }
  proximas: Array<{
    id: string
    cliente_nombre: string
    servicio: string
    fecha: string
    hora: string
    estado: string
  }>
  distribucion: Record<string, number>
  top_servicios: Array<{ nombre: string; total: number }>
  citas_semana: Array<{ fecha: string; estado: string }>
  citas_meses: Array<{ fecha: string; estado: string; precio: number }>
}

/* ── Main Dashboard ── */
export default function AdminDashboard() {
  const todayStr = today()

  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Error al cargar el dashboard')))
      .then((d: DashboardData) => setData(d))
      .catch((e: Error) => setError(e.message ?? 'Error al conectar con el servidor.'))
      .finally(() => setLoading(false))
  }, [])

  // Bar chart: citas últimos 7 días
  const weekData = useMemo(() => {
    const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const citasSemana = data?.citas_semana ?? []
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().slice(0, 10)
      return {
        label: DAYS[d.getDay()],
        value: citasSemana.filter(c => c.fecha === dateStr).length,
        today: dateStr === todayStr,
      }
    })
  }, [data?.citas_semana, todayStr])

  // Donut: por estado
  const estadoData = useMemo(() => {
    const dist = data?.distribucion ?? {}
    return [
      { label: 'Completada', value: dist.completada  ?? 0, color: '#C2D1D3' },
      { label: 'Programada', value: dist.programada  ?? 0, color: '#896646' },
      { label: 'No asistió', value: dist.no_asistio  ?? 0, color: '#DECCBE' },
      { label: 'Cancelada',  value: dist.cancelada   ?? 0, color: '#c1ab9d' },
    ]
  }, [data?.distribucion])

  // Donut: top servicios
  const servicioData = useMemo(() => {
    const COLORS = ['#896646', '#B1906F', '#c1ab9d', '#C2D1D3', '#DECCBE']
    return (data?.top_servicios ?? []).map(({ nombre, total }, i) => ({
      label: nombre,
      value: total,
      color: COLORS[i],
    }))
  }, [data?.top_servicios])

  // Ingresos por mes (últimos 6 meses)
  const ingresosMensuales = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - (5 - i))
      return {
        key:   d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('es-CO', { month: 'short' }),
        value: 0,
      }
    })
    ;(data?.citas_meses ?? [])
      .filter(c => c.estado === 'completada')
      .forEach(c => {
        const m = months.find(mo => c.fecha.startsWith(mo.key))
        if (m) m.value += c.precio ?? 0
      })
    return months
  }, [data?.citas_meses])

  const maxIngreso = Math.max(...ingresosMensuales.map(m => m.value), 1)

  const totalCitasAll = data?.distribucion
    ? Object.values(data.distribucion).reduce((s, v) => s + v, 0)
    : 0

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-page-header"><div><h1>Dashboard</h1></div></div>
        <div style={{ padding: '2rem', color: 'var(--c-danger)', textAlign: 'center' }}>
          <p>{error}</p>
          <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const kpis     = data?.kpis
  const proximas = data?.proximas ?? []

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen general de la clínica · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/admin/citas" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.65rem 1.5rem' }}>
          + Nueva cita
        </Link>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi-grid">
        {loading ? (
          <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
        ) : (
          <>
            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div>
                <div className="kpi-card__val">{kpis?.total_clientes ?? 0}</div>
                <div className="kpi-card__label">Clientes totales</div>
              </div>
              <span className="kpi-card__trend kpi-card__trend--up">↑ activos</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div>
                <div className="kpi-card__val" style={{ fontSize: '1.5rem' }}>{formatCOP(kpis?.ingresos_este_mes ?? 0)}</div>
                <div className="kpi-card__label">Ingresos este mes</div>
              </div>
              <span className="kpi-card__trend kpi-card__trend--up">↑ completadas</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <div className="kpi-card__val">{kpis?.citas_este_mes ?? 0}</div>
                <div className="kpi-card__label">Citas este mes</div>
              </div>
              <span className="kpi-card__trend kpi-card__trend--up">
                ↑ {(data?.citas_semana ?? []).filter(c => c.fecha === todayStr).length} hoy
              </span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__icon kpi-card__icon--red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <div className="kpi-card__val">{kpis?.canceladas_este_mes ?? 0}</div>
                <div className="kpi-card__label">Citas canceladas</div>
              </div>
              <span className="kpi-card__trend kpi-card__trend--down">
                {totalCitasAll > 0
                  ? `${Math.round(((data?.distribucion?.cancelada ?? 0) / totalCitasAll) * 100)}% del total`
                  : 'este mes'
                }
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Charts row ── */}
      <div className="dash-charts-row">
        <div className="chart-card dash-charts-row__main">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Citas — últimos 7 días</p>
              <p className="chart-card__sub">Número de citas por día</p>
            </div>
          </div>
          {loading ? <ChartSkeleton height={120} /> : <BarChart data={weekData} color="#896646" />}
        </div>

        <div className="chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Estado de citas</p>
              <p className="chart-card__sub">Distribución total</p>
            </div>
          </div>
          {loading ? <ChartSkeleton height={140} /> : <DonutChart slices={estadoData} />}
        </div>
      </div>

      {/* ── Revenue bars + services ── */}
      <div className="dash-charts-row" style={{ marginTop: '1.5rem' }}>
        <div className="chart-card dash-charts-row__main">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Ingresos por mes</p>
              <p className="chart-card__sub">Citas completadas — últimos 6 meses</p>
            </div>
            <span style={{ fontFamily: 'var(--f-display)', fontSize: '1.25rem', color: 'var(--c-accent)', fontWeight: 300 }}>
              {formatCOP(ingresosMensuales.reduce((s, m) => s + m.value, 0))}
            </span>
          </div>
          {loading ? <ChartSkeleton height={120} /> : (
            <div className="revenue-bars">
              {ingresosMensuales.map((m, i) => (
                <div key={i} className="revenue-bars__col">
                  <span className="revenue-bars__val">
                    {m.value > 0 ? `$${Math.round(m.value / 1000)}k` : ''}
                  </span>
                  <div className="revenue-bars__track">
                    <div
                      className="revenue-bars__fill"
                      style={{
                        height: `${Math.max((m.value / maxIngreso) * 100, m.value > 0 ? 4 : 0)}%`,
                        background: m.key === todayStr.slice(0, 7)
                          ? 'linear-gradient(to top, var(--c-accent), var(--c-accent-lt))'
                          : 'var(--c-warm-2)',
                      }}
                    />
                  </div>
                  <span className="revenue-bars__label">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card__header">
            <div>
              <p className="chart-card__title">Top servicios</p>
              <p className="chart-card__sub">Por nro. de citas</p>
            </div>
          </div>
          {loading ? <ChartSkeleton height={140} /> : <DonutChart slices={servicioData} />}
        </div>
      </div>

      {/* ── Próximas citas ── */}
      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <div className="chart-card__header">
          <div>
            <p className="chart-card__title">Citas de hoy</p>
            <p className="chart-card__sub">Solo citas programadas para hoy</p>
          </div>
          <Link href="/admin/citas" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Ver todas →
          </Link>
        </div>
        <div className="upcoming-list">
          {loading ? (
            <UpcomingSkeleton />
          ) : proximas.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', padding: '1rem 0' }}>No hay citas próximas.</p>
          ) : (
            proximas.map(appt => {
              const isToday = appt.fecha === todayStr
              return (
                <div key={appt.id} className="upcoming-item">
                  <div className="upcoming-item__avatar">
                    {(appt.cliente_nombre ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="upcoming-item__info">
                    <span className="upcoming-item__name">{appt.cliente_nombre ?? 'Desconocido'}</span>
                    <span className="upcoming-item__service">{appt.servicio}</span>
                  </div>
                  <div className="upcoming-item__time">
                    <span className={`upcoming-item__date ${isToday ? 'upcoming-item__date--today' : ''}`}>
                      {isToday ? 'Hoy' : new Date(appt.fecha + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="upcoming-item__hour">{appt.hora?.slice(0, 5)}</span>
                  </div>
                  <span className={`status-badge status-${appt.estado}`}>{appt.estado}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}