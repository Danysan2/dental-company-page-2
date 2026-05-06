'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { api } from '@/lib/apiFetch'
import { formatCOP, formatFecha } from '@/lib/helpers'
import { ESTADOS } from '@/lib/helpers'
import styles from './AdminDashboard.module.css'

interface DashboardData {
  kpis: { citasHoy: number; citasMes: number; ingresosMes: number }
  proximasCitas: ProximaCita[]
  distribEstados: { estado: string; total: number }[]
  topServicios:   { nombre: string; total: number }[]
}

interface ProximaCita {
  id:       string
  fecha:    string
  hora:     string
  estado:   string
  cliente:  { nombre: string; telefono?: string | null }
  servicio: { nombre: string }
}

const ESTADO_COLORS: Record<string, string> = {
  programada: '#3b82f6',
  completada: '#22c55e',
  cancelada:  '#ef4444',
  no_asistio: '#f97316',
}

export default function AdminDashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get<DashboardData>('/api/dashboard')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}><div className="spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)', width: 36, height: 36 }} /></div>
  if (error)   return <div className={styles.error}>Error al cargar el dashboard: {error}</div>
  if (!data)   return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <span className={styles.date}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </header>

      {/* KPI Cards */}
      <div className={styles.kpis}>
        <div className={`card ${styles.kpiCard}`}>
          <span className={styles.kpiIcon}>📅</span>
          <div>
            <p className={styles.kpiLabel}>Citas hoy</p>
            <p className={styles.kpiValue}>{data.kpis.citasHoy}</p>
          </div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <span className={styles.kpiIcon}>📆</span>
          <div>
            <p className={styles.kpiLabel}>Citas este mes</p>
            <p className={styles.kpiValue}>{data.kpis.citasMes}</p>
          </div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <span className={styles.kpiIcon}>💰</span>
          <div>
            <p className={styles.kpiLabel}>Ingresos mes</p>
            <p className={styles.kpiValue}>{formatCOP(data.kpis.ingresosMes)}</p>
          </div>
        </div>
      </div>

      <div className={styles.charts}>
        {/* Top servicios */}
        <div className={`card ${styles.chartCard}`}>
          <h2 className={styles.chartTitle}>Top servicios del mes</h2>
          {data.topServicios.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topServicios} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>Sin datos este mes</p>
          )}
        </div>

        {/* Distribución estados */}
        <div className={`card ${styles.chartCard}`}>
          <h2 className={styles.chartTitle}>Estado de citas</h2>
          {data.distribEstados.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.distribEstados} dataKey="total" nameKey="estado" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {data.distribEstados.map((entry) => (
                    <Cell key={entry.estado} fill={ESTADO_COLORS[entry.estado] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>Sin datos este mes</p>
          )}
        </div>
      </div>

      {/* Próximas citas */}
      <div className={`card ${styles.proximasCard}`}>
        <h2 className={styles.chartTitle}>Próximas citas (7 días)</h2>
        {data.proximasCitas.length === 0 ? (
          <p className={styles.empty}>No hay citas programadas</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.proximasCitas.map(c => (
                  <tr key={c.id}>
                    <td>{formatFecha(c.fecha.split('T')[0])}</td>
                    <td>{c.hora}</td>
                    <td>{c.cliente.nombre}</td>
                    <td>{c.servicio.nombre}</td>
                    <td><span className={`badge badge-${c.estado}`}>{ESTADOS.find(e => e.value === c.estado)?.label ?? c.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
