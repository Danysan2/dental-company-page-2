'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { formatCOP } from '@/lib/helpers'
import PhoneInput, { isPhoneComplete } from '@/components/ui/PhoneInput'
import './AdminClientes.css'

/* ── Skeleton ── */
function Skeleton({ width = '100%', height = 16, radius = 8, circle = false }: {
  width?: number | string; height?: number; radius?: number; circle?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? '50%' : radius,
        background: 'linear-gradient(90deg, var(--c-warm-2) 25%, var(--c-warm-1) 50%, var(--c-warm-2) 75%)',
        backgroundSize: '400% 100%',
        animation: 'shimmer 1.4s ease infinite',
        flexShrink: 0,
      }}
    />
  )
}

/* ── Types ── */
interface Cliente {
  id: string
  nombre: string
  cedula: string
  telefono: string
  correo: string
  notas: string
  activo: boolean
  created_at: string
  total_citas: number
  citas_completadas: number
  citas_canceladas: number
  citas_activas: number
  ingresos_generados: number
}

interface HistorialItem {
  id: string
  servicio: string
  fecha: string
  hora: string
  estado: string
  precio: number
}

/* ── Utility ── */
function fmtDate(str: string | undefined | null) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/* ── Modal crear / editar cliente ── */
function ClienteModal({ cliente, onClose, onSaved }: {
  cliente: Cliente | null
  onClose: () => void
  onSaved: () => void
}) {
  const esEdicion = !!cliente
  const [form, setForm] = useState({
    nombre:   cliente?.nombre   ?? '',
    cedula:   cliente?.cedula   ?? '',
    telefono: cliente?.telefono ?? '',
    correo:   cliente?.correo   ?? '',
    notas:    cliente?.notas    ?? '',
  })
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')
  const submitFlight = useRef(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validar = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim())                              e.nombre   = 'El nombre es obligatorio.'
    if (form.nombre.trim().length < 3)                    e.nombre   = 'Mínimo 3 caracteres.'
    if (!form.cedula.trim())                              e.cedula   = 'La cédula es obligatoria.'
    if (!/^\d{6,12}$/.test(form.cedula.trim()))           e.cedula   = 'Solo números, 6-12 dígitos.'
    if (!isPhoneComplete(form.telefono))                   e.telefono = 'Ingresa un número válido con prefijo.'
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                                                          e.correo   = 'Formato de correo inválido.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitFlight.current) return
    if (!validar()) return
    submitFlight.current = true
    setLoading(true)
    setApiError('')
    try {
      const payload = {
        nombre:   form.nombre.trim(),
        cedula:   form.cedula.trim(),
        telefono: form.telefono.trim(),
        correo:   form.correo.trim() || null,
        notas:    form.notas.trim()  || null,
      }
      if (esEdicion) {
        const res = await fetch(`/api/clientes/${cliente!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? 'Error al guardar.')
        }
      } else {
        const res = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? 'Error al guardar.')
        }
      }
      onSaved()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar.'
      if (msg.includes('Ya existe')) {
        setApiError('Ya existe un paciente con esa cédula.')
      } else {
        setApiError(msg)
      }
    } finally {
      submitFlight.current = false
      setLoading(false)
    }
  }

  return (
    <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <aside className="cliente-drawer" style={{ maxWidth: 480 }}>
        <div className="drawer-header">
          <div className="drawer-avatar">{form.nombre?.[0]?.toUpperCase() || '+'}</div>
          <div className="drawer-title">
            <h2>{esEdicion ? 'Editar paciente' : 'Nuevo paciente'}</h2>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ padding: '0 1.5rem 1.5rem' }}>
          {([
            { key: 'nombre', label: 'Nombre completo *', type: 'text',  ph: 'Ana Gómez' },
            { key: 'cedula', label: 'Cédula *',          type: 'text',  ph: '1012345678' },
          ] as const).map(({ key, label, type, ph }) => (
            <div className="form-group" key={key} style={{ marginBottom: '0.9rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>
              <input
                type={type}
                placeholder={ph}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                style={{
                  width: '100%', padding: '0.55rem 0.75rem',
                  border: `1.5px solid ${errors[key] ? '#c62828' : 'var(--c-warm-2)'}`,
                  borderRadius: 8, fontSize: '0.88rem', outline: 'none',
                  background: 'var(--c-bg)',
                  color: 'var(--c-dark)',
                }}
              />
              {errors[key] && (
                <span style={{ fontSize: '0.75rem', color: '#c62828' }}>{errors[key]}</span>
              )}
            </div>
          ))}

          {/* Teléfono con selector de prefijo */}
          <div className="form-group" style={{ marginBottom: '0.9rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Teléfono *</label>
            <PhoneInput
              value={form.telefono}
              onChange={v => set('telefono', v)}
              placeholder="3001234567"
            />
            {errors.telefono && (
              <span style={{ fontSize: '0.75rem', color: '#c62828' }}>{errors.telefono}</span>
            )}
          </div>

          {([
            { key: 'correo', label: 'Correo electrónico', type: 'email', ph: 'ana@gmail.com' },
          ] as const).map(({ key, label, type, ph }) => (
            <div className="form-group" key={key} style={{ marginBottom: '0.9rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>
              <input
                type={type}
                placeholder={ph}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                style={{
                  width: '100%', padding: '0.55rem 0.75rem',
                  border: `1.5px solid ${errors[key] ? '#c62828' : 'var(--c-warm-2)'}`,
                  borderRadius: 8, fontSize: '0.88rem', outline: 'none',
                  background: 'var(--c-bg)',
                  color: 'var(--c-dark)',
                }}
              />
              {errors[key] && (
                <span style={{ fontSize: '0.75rem', color: '#c62828' }}>{errors[key]}</span>
              )}
            </div>
          ))}

          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Notas internas</label>
            <textarea
              placeholder="Alergias, observaciones…"
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '0.55rem 0.75rem',
                border: '1.5px solid var(--c-warm-2)', borderRadius: 8,
                fontSize: '0.88rem', resize: 'vertical', outline: 'none',
                background: 'var(--c-bg)',
                color: 'var(--c-dark)',
              }}
            />
          </div>

          {apiError && (
            <div style={{
              marginBottom: '1rem', padding: '0.6rem 0.75rem',
              background: '#fde8e8', borderRadius: 8,
              color: '#a01a1a', fontSize: '0.82rem',
            }} role="alert">
              {apiError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
              {loading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear paciente'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

/* ── Drawer de detalle del cliente ── */
function ClienteDrawer({ client, onClose, onEdit }: {
  client: Cliente
  onClose: () => void
  onEdit: () => void
}) {
  const [historial,   setHistorial]   = useState<HistorialItem[]>([])
  const [loadingHist, setLoadingHist] = useState(true)
  const [histError,   setHistError]   = useState('')

  useEffect(() => {
    setLoadingHist(true)
    setHistError('')
    fetch(`/api/clientes/${client.id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: HistorialItem[]) => setHistorial(data ?? []))
      .catch(() => {
        setHistError('Error al cargar el historial. Intenta de nuevo.')
        setHistorial([])
      })
      .finally(() => setLoadingHist(false))
  }, [client.id])

  const hoy = new Date().toISOString().slice(0, 10)
  const proxima = historial
    .filter(a => a.fecha >= hoy && ['programada'].includes(a.estado))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0]

  return (
    <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <aside className="cliente-drawer">
        <div className="drawer-header">
          <div className="drawer-avatar">{client.nombre[0].toUpperCase()}</div>
          <div className="drawer-title">
            <h2>{client.nombre}</h2>
            <span className="drawer-since">Cliente desde {fmtDate(client.created_at)}</span>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="drawer-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="drawer-section-title">Información de contacto</h3>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              onClick={onEdit}
            >
              Editar
            </button>
          </div>
          <div className="drawer-info-grid">
            <div className="drawer-info-item">
              <span className="drawer-info-label">Cédula</span>
              <span className="drawer-info-val">{client.cedula || '—'}</span>
            </div>
            <div className="drawer-info-item">
              <span className="drawer-info-label">Teléfono</span>
              <span className="drawer-info-val">{client.telefono || '—'}</span>
            </div>
            <div className="drawer-info-item" style={{ gridColumn: '1/-1' }}>
              <span className="drawer-info-label">Correo</span>
              <span className="drawer-info-val">{client.correo || '—'}</span>
            </div>
            {client.notas && (
              <div className="drawer-info-item" style={{ gridColumn: '1/-1' }}>
                <span className="drawer-info-label">Notas internas</span>
                <span className="drawer-info-val">{client.notas}</span>
              </div>
            )}
          </div>
        </div>

        <div className="drawer-section">
          <h3 className="drawer-section-title">Resumen de citas</h3>
          <div className="drawer-stats">
            <div className="drawer-stat">
              <span className="drawer-stat__num">{client.total_citas ?? 0}</span>
              <span className="drawer-stat__label">Total</span>
            </div>
            <div className="drawer-stat">
              <span className="drawer-stat__num" style={{ color: '#1a7a45' }}>{client.citas_completadas ?? 0}</span>
              <span className="drawer-stat__label">Completadas</span>
            </div>
            <div className="drawer-stat">
              <span className="drawer-stat__num" style={{ color: '#1565c0' }}>{client.citas_activas ?? 0}</span>
              <span className="drawer-stat__label">Activas</span>
            </div>
            <div className="drawer-stat">
              <span className="drawer-stat__num" style={{ color: '#c62828' }}>{client.citas_canceladas ?? 0}</span>
              <span className="drawer-stat__label">Canceladas</span>
            </div>
          </div>
          <div className="drawer-ingresos">
            <span className="drawer-ingresos__label">Ingresos generados</span>
            <span className="drawer-ingresos__val">{formatCOP(client.ingresos_generados ?? 0)}</span>
          </div>
        </div>

        {proxima && (
          <div className="drawer-section">
            <h3 className="drawer-section-title">Próxima cita</h3>
            <div className="drawer-proxima">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div>
                <span className="drawer-proxima__svc">{proxima.servicio}</span>
                <span className="drawer-proxima__date">
                  {fmtDate(proxima.fecha)} — {proxima.hora?.slice(0, 5)}
                </span>
              </div>
              <span className={`status-badge status-${proxima.estado}`}>{proxima.estado}</span>
            </div>
          </div>
        )}

        <div className="drawer-section drawer-section--history">
          <h3 className="drawer-section-title">Historial de citas</h3>
          {loadingHist ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Skeleton width={52} height={11} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Skeleton width="70%" height={12} />
                    <Skeleton width="40%" height={10} />
                  </div>
                  <Skeleton width={64} height={20} radius={99} />
                </div>
              ))}
            </div>
          ) : histError ? (
            <p role="alert" style={{ fontSize: '0.82rem', color: '#dc3545' }}>{histError}</p>
          ) : historial.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Sin citas registradas.</p>
          ) : (
            <div className="drawer-history">
              {historial.map(appt => (
                <div key={appt.id} className="drawer-history-item">
                  <div className="drawer-history-item__date">{fmtDate(appt.fecha)}</div>
                  <div className="drawer-history-item__info">
                    <span className="drawer-history-item__svc">{appt.servicio}</span>
                    <span className="drawer-history-item__hora">{appt.hora?.slice(0, 5)}</span>
                  </div>
                  <span className={`status-badge status-${appt.estado}`}>{appt.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

/* ── Componente principal ── */
export default function AdminClientes() {
  const [clientes,     setClientes]     = useState<Cliente[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [sortKey,      setSortKey]      = useState('nombre')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('asc')
  const [selected,     setSelected]     = useState<Cliente | null>(null)
  const [modalCliente, setModalCliente] = useState<Cliente | null | false>(false)

  const cargar = () => {
    setLoading(true)
    setError('')
    fetch('/api/clientes')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Error cargando clientes')))
      .then((data: Cliente[]) => setClientes(data ?? []))
      .catch((err: Error) => setError(err.message ?? 'Error cargando clientes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const clientesFiltrados = useMemo(() => {
    const q = search.toLowerCase().trim()
    return clientes
      .filter(c => !q || [c.nombre, c.cedula, c.telefono, c.correo]
        .some(v => v?.toLowerCase().includes(q)))
      .sort((a, b) => {
        let va: string | number, vb: string | number
        if (sortKey === 'citas')         { va = a.total_citas ?? 0;          vb = b.total_citas ?? 0 }
        else if (sortKey === 'ingresos') { va = a.ingresos_generados ?? 0;   vb = b.ingresos_generados ?? 0 }
        else { va = (a as unknown as Record<string, string>)[sortKey] ?? ''; vb = (b as unknown as Record<string, string>)[sortKey] ?? '' }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [clientes, search, sortKey, sortDir])

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: string }) => (
    <svg className={`sort-icon ${sortKey === col ? `sort-icon--${sortDir}` : ''}`}
      width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )

  const kpiTotal    = clientes.length
  const kpiConCitas = clientes.filter(c => (c.total_citas ?? 0) > 0).length
  const kpiCitas    = clientes.reduce((s, c) => s + (c.total_citas ?? 0), 0)
  const kpiIngresos = clientes.reduce((s, c) => s + (c.ingresos_generados ?? 0), 0)

  const handleModalSaved = () => {
    setModalCliente(false)
    if (selected) setSelected(null)
    cargar()
  }

  return (
    <div className="admin-clientes">
      <div className="admin-page-header">
        <div>
          <h1>Clientes</h1>
          <p>{clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} encontrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalCliente(null)}>
          + Nuevo paciente
        </button>
      </div>

      {/* KPI mini row */}
      <div className="clientes-kpi-row">
        <div className="clientes-kpi">
          <span className="clientes-kpi__val">{loading ? '…' : kpiTotal}</span>
          <span className="clientes-kpi__label">Total clientes</span>
        </div>
        <div className="clientes-kpi">
          <span className="clientes-kpi__val">{loading ? '…' : kpiConCitas}</span>
          <span className="clientes-kpi__label">Con citas</span>
        </div>
        <div className="clientes-kpi">
          <span className="clientes-kpi__val">{loading ? '…' : kpiCitas}</span>
          <span className="clientes-kpi__label">Citas totales</span>
        </div>
        <div className="clientes-kpi">
          <span className="clientes-kpi__val">{loading ? '…' : formatCOP(kpiIngresos)}</span>
          <span className="clientes-kpi__label">Ingresos totales</span>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="clientes-search-wrap">
        <div className="citas-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, teléfono, correo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="citas-search__clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="citas-table-wrap">
          <table className="citas-table">
            <thead>
              <tr>
                <th>Nombre</th><th>Cédula</th><th>Teléfono</th>
                <th>Correo</th><th>Citas</th><th>Ingresos</th><th>Registro</th><th></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <Skeleton width={32} height={32} circle />
                      <Skeleton width={96} height={13} />
                    </div>
                  </td>
                  <td><Skeleton width={80} height={13} /></td>
                  <td><Skeleton width={88} height={13} /></td>
                  <td><Skeleton width={120} height={13} /></td>
                  <td><Skeleton width={40} height={13} /></td>
                  <td><Skeleton width={72} height={13} /></td>
                  <td><Skeleton width={68} height={13} /></td>
                  <td><Skeleton width={32} height={28} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-ghost" onClick={cargar}>Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="citas-table-wrap">
          {clientesFiltrados.length === 0 ? (
            <div className="citas-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <p>No se encontraron clientes.</p>
              {search && (
                <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={() => setSearch('')}>
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <table className="citas-table">
              <thead>
                <tr>
                  <th className="th-s" onClick={() => toggleSort('nombre')}>
                    Nombre <SortIcon col="nombre" />
                  </th>
                  <th>Cédula</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th className="th-s" onClick={() => toggleSort('citas')}>
                    Citas <SortIcon col="citas" />
                  </th>
                  <th className="th-s" onClick={() => toggleSort('ingresos')}>
                    Ingresos <SortIcon col="ingresos" />
                  </th>
                  <th className="th-s" onClick={() => toggleSort('created_at')}>
                    Registro <SortIcon col="created_at" />
                  </th>
                  <th className="th-center">Ver</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="td-client">
                        <div className="td-client__avatar">{c.nombre[0].toUpperCase()}</div>
                        <span className="td-client__name">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="td-mono">{c.cedula}</td>
                    <td className="td-mono">{c.telefono}</td>
                    <td className="td-email">{c.correo || '—'}</td>
                    <td>
                      <div className="td-citas-badges">
                        <span className="cita-badge cita-badge--total">{c.total_citas ?? 0}</span>
                        {(c.citas_canceladas ?? 0) > 0 && (
                          <span className="cita-badge cita-badge--cancel">{c.citas_canceladas} cancel.</span>
                        )}
                      </div>
                    </td>
                    <td className="td-ingresos">{formatCOP(c.ingresos_generados ?? 0)}</td>
                    <td className="td-mono">{fmtDate(c.created_at)}</td>
                    <td className="th-center">
                      <button
                        className="td-action-btn td-action-btn--edit"
                        onClick={() => setSelected(c)}
                        title="Ver detalle"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Drawer detalle */}
      {selected && (
        <ClienteDrawer
          client={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setModalCliente(selected); setSelected(null) }}
        />
      )}

      {/* Modal crear / editar — false = cerrado, null = nuevo, Cliente = editar */}
      {modalCliente !== false && (
        <ClienteModal
          cliente={modalCliente}
          onClose={() => setModalCliente(false)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  )
}
