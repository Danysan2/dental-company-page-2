'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/context/ToastContext'
import { ESTADOS, HORARIOS, today, startOfWeek, startOfMonth } from '@/lib/helpers'
import './AdminCitas.css'

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
interface Cita {
  id: string
  cliente_id: string
  servicio_id: string
  cliente_nombre: string
  cliente_cedula: string
  cliente_telefono: string
  cliente_correo: string
  servicio: string
  precio: number
  fecha: string
  hora: string
  estado: string
  notas: string
  createdAt: string
}

interface Cliente {
  id: string
  nombre: string
  cedula: string
  telefono: string
  correo: string
}

interface Servicio {
  id: string
  nombre: string
  precio: number
}

/* ── Helpers ── */
function Estado({ v }: { v: string }) {
  return <span className={`status-badge status-${v}`}>{v}</span>
}

function fmtFecha(str: string | undefined, todayStr: string) {
  if (!str) return '—'
  if (str === todayStr) return null
  return new Date(str + 'T12:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: '2-digit',
  })
}

function useEscapeKey(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
}

/* ── Combobox búsqueda + creación de paciente ── */
function ClienteCombobox({ clients, value, onChange, onClienteCreado }: {
  clients: Cliente[]
  value: string
  onChange: (id: string) => void
  onClienteCreado: (c: Cliente) => void
}) {
  const selectedClient = clients.find(c => c.id === value)
  const [query,     setQuery]     = useState(selectedClient?.nombre ?? '')
  const [open,      setOpen]      = useState(false)
  const [creando,   setCreando]   = useState(false)
  const [nuevoForm, setNuevoForm] = useState({ nombre: '', cedula: '', telefono: '', correo: '' })
  const [saving,    setSaving]    = useState(false)
  const [errNuevo,  setErrNuevo]  = useState('')
  const wrapRef     = useRef<HTMLDivElement>(null)
  const crearFlight = useRef(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.trim().length >= 1
    ? clients.filter(c =>
        c.nombre?.toLowerCase().includes(query.toLowerCase()) ||
        c.cedula?.includes(query.trim())
      ).slice(0, 8)
    : []

  const select = (client: Cliente) => {
    onChange(client.id)
    setQuery(client.nombre)
    setOpen(false)
    setCreando(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setOpen(true)
    onChange('')
    setCreando(false)
  }

  const iniciarCreacion = () => {
    setOpen(false)
    setCreando(true)
    setNuevoForm(f => ({ ...f, nombre: query.trim() }))
    setErrNuevo('')
  }

  const handleCrear = async () => {
    if (crearFlight.current) return
    if (!nuevoForm.nombre.trim() || !nuevoForm.cedula.trim() || !nuevoForm.telefono.trim()) {
      setErrNuevo('Nombre, cédula y teléfono son obligatorios.')
      return
    }
    crearFlight.current = true
    setSaving(true)
    setErrNuevo('')
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:   nuevoForm.nombre.trim(),
          cedula:   nuevoForm.cedula.trim(),
          telefono: nuevoForm.telefono.trim(),
          correo:   nuevoForm.correo.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Error al crear el paciente.')
      }
      const nuevo = await res.json()
      onClienteCreado(nuevo)
      select(nuevo)
    } catch (e: unknown) {
      setErrNuevo(e instanceof Error ? e.message : 'Error al crear el paciente.')
    } finally {
      crearFlight.current = false
      setSaving(false)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div className="cliente-search-wrap">
        <svg className="cliente-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="cliente-search-input"
          placeholder="Buscar por nombre o cédula…"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length >= 1 && setOpen(true)}
          autoComplete="off"
        />
        {value && (
          <button
            className="cliente-search-clear"
            onClick={() => { onChange(''); setQuery(''); setCreando(false) }}
            aria-label="Quitar selección"
          >✕</button>
        )}
      </div>

      {open && query.trim().length >= 1 && (
        <div className="cliente-dropdown">
          {filtered.map(c => (
            <button key={c.id} className="cliente-option" onMouseDown={() => select(c)}>
              <span className="cliente-option__name">{c.nombre}</span>
              <span className="cliente-option__meta">{c.cedula} · {c.telefono}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="cliente-no-results">Sin coincidencias</div>
          )}
          <button className="cliente-option cliente-option--new" onMouseDown={iniciarCreacion}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Crear nuevo paciente{query.trim() ? ` "${query.trim()}"` : ''}
          </button>
        </div>
      )}

      {creando && (
        <div className="nuevo-cliente-panel">
          <div className="nuevo-cliente-panel__header">
            <span>Nuevo paciente</span>
            <button onClick={() => setCreando(false)} aria-label="Cerrar">✕</button>
          </div>
          <div className="modal-grid" style={{ marginTop: '0.75rem' }}>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                value={nuevoForm.nombre}
                maxLength={100}
                placeholder="Nombre completo"
                onChange={e => setNuevoForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Cédula *</label>
              <input
                value={nuevoForm.cedula}
                maxLength={12}
                inputMode="numeric"
                placeholder="Nro. de cédula"
                onChange={e => setNuevoForm(f => ({ ...f, cedula: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input
                value={nuevoForm.telefono}
                maxLength={10}
                inputMode="numeric"
                placeholder="10 dígitos"
                onChange={e => setNuevoForm(f => ({ ...f, telefono: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            <div className="form-group">
              <label>Correo <span style={{ fontWeight: 400, opacity: 0.6 }}>(opcional)</span></label>
              <input
                type="email"
                value={nuevoForm.correo}
                maxLength={150}
                placeholder="correo@ejemplo.com"
                onChange={e => setNuevoForm(f => ({ ...f, correo: e.target.value }))}
              />
            </div>
          </div>
          {errNuevo && <p className="modal-err" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{errNuevo}</p>}
          <div className="nuevo-cliente-panel__footer">
            <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={() => setCreando(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={handleCrear} disabled={saving}>
              {saving ? 'Guardando…' : 'Crear y seleccionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Modal crear / editar cita ── */
interface CitaForm {
  cliente_id: string
  servicio_id: string
  servicio: string
  precio: number
  fecha: string
  hora: string
  estado: string
  notas: string
}

const EMPTY_FORM: CitaForm = {
  cliente_id: '', servicio_id: '', servicio: '',
  precio: 0, fecha: '', hora: '', estado: 'programada', notas: '',
}

function CitaModal({ cita, mode, clients, servicios, onClose, onSaved, onClienteCreado }: {
  cita: CitaForm | null
  mode: 'new' | 'edit'
  clients: Cliente[]
  servicios: Servicio[]
  onClose: () => void
  onSaved: (mode: 'new' | 'edit', form: CitaForm) => Promise<void>
  onClienteCreado: (c: Cliente) => void
}) {
  const [form,      setForm]      = useState<CitaForm>(cita ?? EMPTY_FORM)
  const [horasDisp, setHorasDisp] = useState<string[]>(HORARIOS)
  const [loadHoras, setLoadHoras] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')
  const slotVersionRef = useRef(0)
  const saveFlight     = useRef(false)

  useEscapeKey(onClose)

  const upd = (k: keyof CitaForm, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleServicio = (svcId: string) => {
    const svc = servicios.find(s => s.id === svcId)
    setForm(f => ({
      ...f,
      servicio_id: svcId,
      servicio:    svc?.nombre ?? '',
      precio:      svc?.precio ?? f.precio,
    }))
  }

  useEffect(() => {
    if (!form.fecha) return
    setLoadHoras(true)
    const version = ++slotVersionRef.current
    fetch(`/api/citas/disponibilidad?fecha=${form.fecha}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (version !== slotVersionRef.current) return
        const disponibles: string[] = data.disponibles ?? []
        if (mode === 'edit' && cita?.hora && !disponibles.includes(cita.hora.slice(0, 5))) {
          setHorasDisp([cita.hora.slice(0, 5), ...disponibles].sort())
        } else {
          setHorasDisp(disponibles)
        }
      })
      .catch(() => {
        if (version !== slotVersionRef.current) return
        setHorasDisp(HORARIOS)
        setErr('No se pudo verificar disponibilidad. Se muestran todos los horarios.')
      })
      .finally(() => { if (version === slotVersionRef.current) setLoadHoras(false) })
  }, [form.fecha, mode, cita?.hora])

  const save = async () => {
    if (saveFlight.current) return
    if (!form.cliente_id || !form.servicio_id || !form.fecha || !form.hora) {
      setErr('Completa los campos obligatorios (*).')
      return
    }
    saveFlight.current = true
    setSaving(true)
    setErr('')
    try {
      await onSaved(mode, form)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al guardar la cita.')
    } finally {
      saveFlight.current = false
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="cita-modal-title">
        <div className="modal-header">
          <h2 id="cita-modal-title">{mode === 'new' ? 'Nueva cita' : 'Editar cita'}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Paciente *</label>
              <ClienteCombobox
                clients={clients}
                value={form.cliente_id}
                onChange={id => upd('cliente_id', id)}
                onClienteCreado={onClienteCreado}
              />
            </div>

            <div className="form-group">
              <label>Servicio *</label>
              <select value={form.servicio_id} onChange={e => handleServicio(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Precio (COP)</label>
              <input
                type="number" min="0" step="1000"
                value={form.precio}
                onChange={e => upd('precio', Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select value={form.estado} onChange={e => upd('estado', e.target.value)}>
                {ESTADOS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => { upd('fecha', e.target.value); upd('hora', '') }}
              />
            </div>

            <div className="form-group">
              <label>Hora * {loadHoras && <small style={{ color: 'var(--text-3)' }}>(cargando…)</small>}</label>
              <select
                value={form.hora}
                onChange={e => upd('hora', e.target.value)}
                disabled={!form.fecha || loadHoras}
              >
                <option value="">— Seleccionar —</option>
                {horasDisp.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              {form.fecha && horasDisp.length === 0 && !loadHoras && (
                <small style={{ color: '#c62828' }}>No hay horas disponibles para esta fecha.</small>
              )}
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Notas</label>
              <textarea
                rows={2}
                value={form.notas}
                onChange={e => upd('notas', e.target.value)}
                placeholder="Observaciones, alergias, indicaciones…"
                maxLength={500}
              />
            </div>
          </div>
          {err && <p className="modal-err">{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || loadHoras}>
            {saving ? 'Guardando…' : mode === 'new' ? 'Crear cita' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Modal reagendar ── */
function ReagendarModal({ cita, onClose, onSaved }: {
  cita: Cita
  onClose: () => void
  onSaved: (id: string, fecha: string, hora: string) => Promise<void>
}) {
  const [fecha,     setFecha]     = useState(cita.fecha)
  const [hora,      setHora]      = useState('')
  const [horasDisp, setHorasDisp] = useState<string[]>(HORARIOS)
  const [loadHoras, setLoadHoras] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')
  const slotVersionRef  = useRef(0)
  const confirmarFlight = useRef(false)

  useEscapeKey(onClose)

  useEffect(() => {
    if (!fecha) return
    setLoadHoras(true)
    setHora('')
    const version = ++slotVersionRef.current
    fetch(`/api/citas/disponibilidad?fecha=${fecha}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (version === slotVersionRef.current) setHorasDisp(data.disponibles ?? []) })
      .catch(() => {
        if (version !== slotVersionRef.current) return
        setHorasDisp(HORARIOS)
        setErr('No se pudo verificar disponibilidad. Se muestran todos los horarios.')
      })
      .finally(() => { if (version === slotVersionRef.current) setLoadHoras(false) })
  }, [fecha])

  const confirmar = async () => {
    if (confirmarFlight.current) return
    if (!fecha || !hora) { setErr('Selecciona fecha y hora.'); return }
    confirmarFlight.current = true
    setSaving(true)
    setErr('')
    try {
      await onSaved(cita.id, fecha, hora)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al reagendar.')
    } finally {
      confirmarFlight.current = false
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 420 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Reagendar cita</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          <div className="reagendar-info">
            <span className="reagendar-info__name">{cita.cliente_nombre}</span>
            <span className="reagendar-info__svc">{cita.servicio}</span>
          </div>
          <div className="modal-grid">
            <div className="form-group">
              <label>Nueva fecha *</label>
              <input
                type="date"
                value={fecha}
                min={today()}
                onChange={e => setFecha(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Nueva hora * {loadHoras && <small style={{ color: 'var(--text-3)' }}>(cargando…)</small>}</label>
              <select
                value={hora}
                onChange={e => setHora(e.target.value)}
                disabled={!fecha || loadHoras}
              >
                <option value="">— Seleccionar —</option>
                {horasDisp.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          {err && <p className="modal-err">{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!fecha || !hora || saving || loadHoras}
            onClick={confirmar}
          >
            {saving ? 'Guardando…' : 'Confirmar reagenda'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Confirmar cancelación ── */
function CancelConfirm({ cita, onClose, onConfirmed }: {
  cita: Cita
  onClose: () => void
  onConfirmed: (id: string) => Promise<void>
}) {
  const [saving, setSaving]  = useState(false)
  const [err,    setErr]     = useState('')
  const cancelFlight         = useRef(false)
  useEscapeKey(onClose)

  const confirmar = async () => {
    if (cancelFlight.current) return
    cancelFlight.current = true
    setSaving(true)
    setErr('')
    try {
      await onConfirmed(cita.id)
      onClose()
    } catch (e: unknown) {
      cancelFlight.current = false
      setSaving(false)
      setErr(e instanceof Error ? e.message : 'No se pudo cancelar la cita. Intenta de nuevo.')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 400 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Cancelar cita</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-2)' }}>
            ¿Confirmas que deseas cancelar la cita de{' '}
            <strong>{cita.cliente_nombre}</strong> para el{' '}
            <strong>
              {new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                weekday: 'long', day: '2-digit', month: 'long',
              })}
            </strong>{' '}
            a las <strong>{cita.hora?.slice(0, 5)}</strong>?
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
            La cita quedará registrada como cancelada y no podrá reactivarse.
          </p>
          {err && (
            <p role="alert" style={{ fontSize: '0.82rem', color: '#dc3545', marginTop: '0.75rem', fontWeight: 500 }}>
              {err}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Volver</button>
          <button
            className="btn"
            style={{ background: '#dc3545', color: '#fff', border: 'none' }}
            onClick={confirmar}
            disabled={saving}
          >
            {saving ? 'Cancelando…' : 'Sí, cancelar cita'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Componente principal ── */
const FILTER_OPTIONS = [
  { key: 'all',   label: 'Todas' },
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
]

export default function AdminCitas() {
  const { toast } = useToast()

  const [citas,     setCitas]     = useState<Cita[]>([])
  const [clientes,  setClientes]  = useState<Cliente[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading,   setLoading]   = useState(true)
  const [loadErr,   setLoadErr]   = useState('')

  const [timeFilter,   setTimeFilter]   = useState('all')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [search,       setSearch]       = useState('')
  const [sortKey,      setSortKey]      = useState('fecha')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('asc')
  const [page,         setPage]         = useState(1)
  const PAGE = 12

  const [modal,    setModal]    = useState<string | null>(null)
  const [selected, setSelected] = useState<Cita | null>(null)

  const todayStr = useMemo(() => today(),        [])
  const weekStr  = useMemo(() => startOfWeek(),  [])
  const monthStr = useMemo(() => startOfMonth(), [])

  /* ── Cargar datos ── */
  const cargar = useCallback(() => {
    setLoading(true)
    setLoadErr('')
    Promise.all([
      fetch('/api/citas').then(r => r.ok ? r.json() : Promise.reject(new Error('Error cargando citas'))),
      fetch('/api/clientes').then(r => r.ok ? r.json() : Promise.reject(new Error('Error cargando clientes'))),
      fetch('/api/servicios').then(r => r.ok ? r.json() : Promise.reject(new Error('Error cargando servicios'))),
    ])
      .then(([c, cl, sv]) => {
        setCitas(c ?? [])
        setClientes(cl ?? [])
        setServicios(sv ?? [])
      })
      .catch((err: Error) => setLoadErr(err.message ?? 'Error cargando datos.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  /* ── Filtrado + ordenación ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return citas
      .filter(a => {
        if (timeFilter === 'today' && a.fecha !== todayStr) return false
        if (timeFilter === 'week'  && a.fecha < weekStr)   return false
        if (timeFilter === 'month' && a.fecha < monthStr)  return false
        if (estadoFilter && a.estado !== estadoFilter)     return false
        if (q && ![a.cliente_nombre, a.cliente_cedula, a.cliente_telefono, a.servicio, a.estado]
          .some(v => v?.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => {
        let va: string, vb: string
        if (sortKey === 'nombre') { va = a.cliente_nombre ?? ''; vb = b.cliente_nombre ?? '' }
        else { va = (a as unknown as Record<string, string>)[sortKey] ?? ''; vb = (b as unknown as Record<string, string>)[sortKey] ?? '' }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [citas, timeFilter, estadoFilter, search, sortKey, sortDir, todayStr, weekStr, monthStr])

  const counts = useMemo(() => ({
    all:   citas.length,
    today: citas.filter(a => a.fecha === todayStr).length,
    week:  citas.filter(a => a.fecha >= weekStr).length,
    month: citas.filter(a => a.fecha >= monthStr).length,
  }), [citas, todayStr, weekStr, monthStr])

  const pages = Math.ceil(filtered.length / PAGE)
  const paged = filtered.slice((page - 1) * PAGE, page * PAGE)

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: string }) => (
    <svg className={`sort-icon ${sortKey === col ? `sort-icon--${sortDir}` : ''}`}
      width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )

  /* ── Handlers CRUD ── */
  const handleSaved = useCallback(async (mode: 'new' | 'edit', form: CitaForm) => {
    if (mode === 'new') {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId:  form.cliente_id,
          servicioId: form.servicio_id,
          precio:     form.precio,
          fecha:      form.fecha,
          hora:       form.hora,
          estado:     form.estado,
          notas:      form.notas || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Error al crear la cita.')
      }
      toast('Cita creada correctamente.', 'success')
    } else {
      if (!selected) return
      const res = await fetch(`/api/citas/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId:  form.cliente_id,
          servicioId: form.servicio_id,
          precio:     form.precio,
          fecha:      form.fecha,
          hora:       form.hora,
          estado:     form.estado,
          notas:      form.notas || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Error al actualizar la cita.')
      }
      toast('Cita actualizada.', 'info')
    }
    cargar()
  }, [selected, cargar, toast])

  const handleReagendar = useCallback(async (id: string, fecha: string, hora: string) => {
    const res = await fetch(`/api/citas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, hora }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Error al reagendar.')
    }
    toast('Cita reagendada correctamente.', 'success')
    cargar()
  }, [cargar, toast])

  const handleCancel = useCallback(async (id: string) => {
    const res = await fetch(`/api/citas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Error al cancelar la cita.')
    }
    toast('Cita cancelada.', 'warning')
    cargar()
  }, [cargar, toast])

  const handleClienteCreado = useCallback((nuevo: Cliente) => {
    setClientes(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
  }, [])

  const openEdit = useCallback((appt: Cita) => { setSelected(appt); setModal('edit') }, [])
  const openRe   = useCallback((appt: Cita) => { setSelected(appt); setModal('reagendar') }, [])
  const openCan  = useCallback((appt: Cita) => { setSelected(appt); setModal('cancel') }, [])

  /* ── Render ── */
  return (
    <div className="admin-citas">
      <div className="admin-page-header">
        <div>
          <h1>Citas</h1>
          <p>{filtered.length} cita{filtered.length !== 1 ? 's' : ''} encontradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('new') }}>
          + Agendar cita
        </button>
      </div>

      {/* Tabs de periodo */}
      <div className="citas-tabs">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`citas-tab ${timeFilter === opt.key ? 'citas-tab--active' : ''}`}
            onClick={() => { setTimeFilter(opt.key); setPage(1) }}
          >
            {opt.label}
            <span className="citas-tab__count">{counts[opt.key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="citas-filters">
        <div className="citas-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por paciente, cédula, servicio…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          {search && (
            <button className="citas-search__clear" onClick={() => setSearch('')} aria-label="Limpiar">✕</button>
          )}
        </div>
        <select
          value={estadoFilter}
          onChange={e => { setEstadoFilter(e.target.value); setPage(1) }}
          className="citas-filter-select"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="citas-table-wrap">
          <table className="citas-table">
            <thead>
              <tr>
                <th>Paciente</th><th>Teléfono</th><th>Servicio</th>
                <th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <Skeleton width={34} height={34} circle />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Skeleton width={100} height={13} />
                        <Skeleton width={68} height={11} />
                      </div>
                    </div>
                  </td>
                  <td><Skeleton width={88} height={13} /></td>
                  <td><Skeleton width={110} height={13} /></td>
                  <td><Skeleton width={78} height={13} /></td>
                  <td><Skeleton width={46} height={13} /></td>
                  <td><Skeleton width={78} height={22} radius={99} /></td>
                  <td><Skeleton width={68} height={28} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loadErr && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#c62828', marginBottom: '1rem' }}>{loadErr}</p>
          <button className="btn btn-ghost" onClick={cargar}>Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      {!loading && !loadErr && (
        <div className="citas-table-wrap">
          {paged.length === 0 ? (
            <div className="citas-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>No hay citas para este filtro.</p>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem' }}
                onClick={() => { setTimeFilter('all'); setEstadoFilter(''); setSearch('') }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <table className="citas-table">
              <thead>
                <tr>
                  <th className="th-s" onClick={() => toggleSort('nombre')}>
                    Paciente <SortIcon col="nombre" />
                  </th>
                  <th>Teléfono</th>
                  <th className="th-s" onClick={() => toggleSort('servicio')}>
                    Servicio <SortIcon col="servicio" />
                  </th>
                  <th className="th-s" onClick={() => toggleSort('fecha')}>
                    Fecha <SortIcon col="fecha" />
                  </th>
                  <th className="th-s" onClick={() => toggleSort('hora')}>
                    Hora <SortIcon col="hora" />
                  </th>
                  <th className="th-s" onClick={() => toggleSort('estado')}>
                    Estado <SortIcon col="estado" />
                  </th>
                  <th className="th-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(appt => {
                  const fechaFmt = fmtFecha(appt.fecha, todayStr)
                  return (
                    <tr
                      key={appt.id}
                      className={
                        appt.estado === 'cancelada' ? 'row-cancelled'
                        : appt.fecha === todayStr   ? 'row-today'
                        : ''
                      }
                    >
                      <td>
                        <div className="td-client">
                          <div className="td-client__avatar">
                            {(appt.cliente_nombre ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="td-client__name">{appt.cliente_nombre ?? '—'}</span>
                            <span className="td-client__cedula">{appt.cliente_cedula ?? ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="td-mono">{appt.cliente_telefono ?? '—'}</td>
                      <td><span className="td-svc">{appt.servicio}</span></td>
                      <td className="td-mono">
                        {fechaFmt === null
                          ? <span className="td-today-label">Hoy</span>
                          : fechaFmt
                        }
                      </td>
                      <td className="td-mono">{appt.hora?.slice(0, 5)}</td>
                      <td><Estado v={appt.estado} /></td>
                      <td>
                        <div className="td-actions">
                          <button
                            className="td-action-btn td-action-btn--edit"
                            onClick={() => openEdit(appt)}
                            disabled={appt.estado === 'cancelada'}
                            title="Editar"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className="td-action-btn td-action-btn--re"
                            onClick={() => openRe(appt)}
                            disabled={appt.estado === 'cancelada' || appt.estado === 'completada'}
                            title="Reagendar"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <polyline points="1 4 1 10 7 10"/>
                              <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                            </svg>
                          </button>
                          <button
                            className="td-action-btn td-action-btn--cancel"
                            onClick={() => openCan(appt)}
                            disabled={appt.estado === 'cancelada' || appt.estado === 'completada'}
                            title="Cancelar"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="15" y1="9" x2="9" y2="15"/>
                              <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div className="citas-pagination">
          <button className="btn btn-ghost pag-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Anterior
          </button>
          <span className="pag-info">Pág {page} de {pages}</span>
          <button className="btn btn-ghost pag-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
            Siguiente →
          </button>
        </div>
      )}

      {/* Modales */}
      {modal === 'new' && (
        <CitaModal
          mode="new" cita={null}
          clients={clientes} servicios={servicios}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onClienteCreado={handleClienteCreado}
        />
      )}
      {modal === 'edit' && selected && (
        <CitaModal
          mode="edit"
          cita={{
            cliente_id:  selected.cliente_id,
            servicio_id: selected.servicio_id,
            servicio:    selected.servicio,
            precio:      selected.precio,
            fecha:       selected.fecha,
            hora:        selected.hora?.slice(0, 5),
            estado:      selected.estado,
            notas:       selected.notas ?? '',
          }}
          clients={clientes} servicios={servicios}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onClienteCreado={handleClienteCreado}
        />
      )}
      {modal === 'reagendar' && selected && (
        <ReagendarModal
          cita={selected}
          onClose={() => setModal(null)}
          onSaved={handleReagendar}
        />
      )}
      {modal === 'cancel' && selected && (
        <CancelConfirm
          cita={selected}
          onClose={() => setModal(null)}
          onConfirmed={handleCancel}
        />
      )}
    </div>
  )
}
