'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/apiFetch'
import { ESTADOS, HORARIOS, formatFecha, formatCOP, today, daysFromNow } from '@/lib/helpers'
import { useToast } from '@/context/ToastContext'
import { enviarCorreosCita } from '@/lib/emailService'
import styles from './AdminCitas.module.css'

interface Servicio { id: string; nombre: string; precio: number; duracion: number }
interface Cliente  { id: string; nombre: string; telefono?: string | null; correo?: string | null; cedula?: string | null }
interface Cita {
  id:        string
  fecha:     string
  hora:      string
  estado:    string
  notas?:    string | null
  precio?:   number | null
  cliente:   Cliente
  servicio:  Servicio
}

const ESTADO_LABELS: Record<string, string> = Object.fromEntries(ESTADOS.map(e => [e.value, e.label]))

const emptyForm = {
  clienteId:  '',
  servicioId: '',
  fecha:      '',
  hora:       '',
  notas:      '',
  precio:     '',
}

export default function AdminCitas() {
  const { toast } = useToast()

  const [citas,     setCitas]     = useState<Cita[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading,   setLoading]   = useState(true)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroDesde,  setFiltroDesde]  = useState(today())
  const [filtroHasta,  setFiltroHasta]  = useState(daysFromNow(30))

  // Modales
  const [showModal,    setShowModal]    = useState(false)
  const [showReagendar,setShowReagendar]= useState(false)
  const [showCancel,   setShowCancel]   = useState(false)
  const [editingCita,  setEditingCita]  = useState<Cita | null>(null)

  // Formulario
  const [form,        setForm]        = useState(emptyForm)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')

  // Cliente combobox
  const [clienteQuery,   setClienteQuery]   = useState('')
  const [clienteOptions, setClienteOptions] = useState<Cliente[]>([])
  const [selectedCliente,setSelectedCliente]= useState<Cliente | null>(null)
  const [creatingCliente,setCreatingCliente]= useState(false)
  const [newClienteForm, setNewClienteForm] = useState({ nombre: '', cedula: '', telefono: '', correo: '' })

  // Reagendar
  const [reagendarFecha, setReagendar] = useState({ fecha: '', hora: '' })

  const loadCitas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroDesde)  params.set('desde', filtroDesde)
      if (filtroHasta)  params.set('hasta', filtroHasta)
      if (filtroEstado) params.set('estado', filtroEstado)
      const data = await api.get<Cita[]>(`/api/citas?${params}`)
      setCitas(data)
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }, [filtroDesde, filtroHasta, filtroEstado, toast])

  useEffect(() => { loadCitas() }, [loadCitas])

  useEffect(() => {
    api.get<Servicio[]>('/api/servicios').then(setServicios).catch(() => {})
  }, [])

  // Buscar clientes
  useEffect(() => {
    if (clienteQuery.length < 2) { setClienteOptions([]); return }
    const t = setTimeout(() => {
      api.get<Cliente[]>(`/api/clientes?q=${encodeURIComponent(clienteQuery)}`)
        .then(setClienteOptions)
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [clienteQuery])

  function openNew() {
    setEditingCita(null)
    setForm(emptyForm)
    setSelectedCliente(null)
    setClienteQuery('')
    setFormError('')
    setCreatingCliente(false)
    setNewClienteForm({ nombre: '', cedula: '', telefono: '', correo: '' })
    setShowModal(true)
  }

  function openEdit(cita: Cita) {
    setEditingCita(cita)
    setForm({
      clienteId:  cita.cliente.id,
      servicioId: cita.servicio.id,
      fecha:      cita.fecha.split('T')[0],
      hora:       cita.hora,
      notas:      cita.notas ?? '',
      precio:     cita.precio?.toString() ?? '',
    })
    setSelectedCliente(cita.cliente)
    setClienteQuery(cita.cliente.nombre)
    setFormError('')
    setCreatingCliente(false)
    setShowModal(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.clienteId && !creatingCliente) { setFormError('Selecciona un paciente'); return }
    if (!form.servicioId)  { setFormError('Selecciona un servicio'); return }
    if (!form.fecha)       { setFormError('Selecciona una fecha'); return }
    if (!form.hora)        { setFormError('Selecciona una hora'); return }

    setSubmitting(true)
    try {
      let clienteId = form.clienteId

      // Crear cliente si es nuevo
      if (creatingCliente) {
        if (!newClienteForm.nombre.trim()) { setFormError('El nombre del paciente es requerido'); return }
        const nc = await api.post<Cliente>('/api/clientes', newClienteForm)
        clienteId = nc.id
      }

      const servicioSeleccionado = servicios.find(s => s.id === form.servicioId)
      const payload = {
        clienteId,
        servicioId: form.servicioId,
        fecha:      form.fecha,
        hora:       form.hora,
        notas:      form.notas || null,
        precio:     form.precio ? parseInt(form.precio) : (servicioSeleccionado?.precio ?? null),
      }

      let cita: Cita
      if (editingCita) {
        cita = await api.put<Cita>(`/api/citas/${editingCita.id}`, payload)
        toast('Cita actualizada', 'success')
      } else {
        cita = await api.post<Cita>('/api/citas', payload)
        toast('Cita creada', 'success')
        // Email en background
        if (servicioSeleccionado) {
          enviarCorreosCita({
            nombrePaciente: cita.cliente.nombre,
            correo:         cita.cliente.correo,
            telefono:       cita.cliente.telefono,
            servicio:       servicioSeleccionado.nombre,
            fecha:          cita.fecha,
            hora:           cita.hora,
          }).catch(() => {})
        }
      }

      setShowModal(false)
      loadCitas()
    } catch (err: unknown) {
      setFormError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReagendar() {
    if (!editingCita) return
    if (!reagendarFecha.fecha || !reagendarFecha.hora) { toast('Selecciona fecha y hora', 'warning'); return }
    setSubmitting(true)
    try {
      await api.put(`/api/citas/${editingCita.id}`, reagendarFecha)
      toast('Cita reagendada', 'success')
      setShowReagendar(false)
      loadCitas()
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!editingCita) return
    setSubmitting(true)
    try {
      await api.delete(`/api/citas/${editingCita.id}`)
      toast('Cita cancelada', 'success')
      setShowCancel(false)
      loadCitas()
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function cambiarEstado(cita: Cita, estado: string) {
    try {
      await api.put(`/api/citas/${cita.id}`, { estado })
      toast(`Estado actualizado: ${ESTADO_LABELS[estado]}`, 'success')
      loadCitas()
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Citas</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva cita</button>
      </header>

      {/* Filtros */}
      <div className={`card ${styles.filters}`}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Desde</label>
          <input type="date" className="form-control" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Hasta</label>
          <input type="date" className="form-control" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Estado</label>
          <select className="form-control" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadCitas} style={{ alignSelf: 'flex-end' }}>Buscar</button>
      </div>

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <div className={styles.loading}><div className="spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} /></div>
        ) : citas.length === 0 ? (
          <p className={styles.empty}>No hay citas en el período seleccionado</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Servicio</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map(c => (
                  <tr key={c.id}>
                    <td>{formatFecha(c.fecha.split('T')[0])}</td>
                    <td>{c.hora}</td>
                    <td>
                      <div>{c.cliente.nombre}</div>
                      {c.cliente.telefono && <div className={styles.subtext}>{c.cliente.telefono}</div>}
                    </td>
                    <td>{c.servicio.nombre}</td>
                    <td>{c.precio ? formatCOP(c.precio) : '—'}</td>
                    <td>
                      <select
                        className={`badge badge-${c.estado} ${styles.estadoSelect}`}
                        value={c.estado}
                        onChange={e => cambiarEstado(c, e.target.value)}
                      >
                        {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Editar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditingCita(c); setReagendar({ fecha: '', hora: '' }); setShowReagendar(true) }}>Reagendar</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => { setEditingCita(c); setShowCancel(true) }}>Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nueva/editar cita */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">{editingCita ? 'Editar cita' : 'Nueva cita'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Cliente combobox */}
            <div className="form-group">
              <label>Paciente</label>
              {!creatingCliente ? (
                <>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nombre, cédula o teléfono…"
                    value={clienteQuery}
                    onChange={e => { setClienteQuery(e.target.value); setSelectedCliente(null); setForm(f => ({ ...f, clienteId: '' })) }}
                  />
                  {clienteOptions.length > 0 && !selectedCliente && (
                    <div className={styles.dropdown}>
                      {clienteOptions.map(c => (
                        <button key={c.id} className={styles.dropdownItem} onClick={() => {
                          setSelectedCliente(c)
                          setClienteQuery(c.nombre)
                          setForm(f => ({ ...f, clienteId: c.id }))
                          setClienteOptions([])
                        }}>
                          <strong>{c.nombre}</strong>
                          {c.cedula && <span> · CC {c.cedula}</span>}
                          {c.telefono && <span> · {c.telefono}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: '4px' }} onClick={() => setCreatingCliente(true)}>
                    + Nuevo paciente
                  </button>
                </>
              ) : (
                <div className={styles.newClienteForm}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Nombre *</label>
                      <input type="text" className="form-control" value={newClienteForm.nombre} onChange={e => setNewClienteForm(f => ({ ...f, nombre: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Cédula</label>
                      <input type="text" className="form-control" value={newClienteForm.cedula} onChange={e => setNewClienteForm(f => ({ ...f, cedula: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Teléfono</label>
                      <input type="text" className="form-control" value={newClienteForm.telefono} onChange={e => setNewClienteForm(f => ({ ...f, telefono: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Correo</label>
                      <input type="email" className="form-control" value={newClienteForm.correo} onChange={e => setNewClienteForm(f => ({ ...f, correo: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: '.5rem' }} onClick={() => setCreatingCliente(false)}>
                    ← Buscar existente
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Servicio</label>
              <select className="form-control" value={form.servicioId} onChange={e => setForm(f => ({ ...f, servicioId: e.target.value }))}>
                <option value="">Seleccionar…</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} — {formatCOP(s.precio)}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Fecha</label>
                <input type="date" className="form-control" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} min={today()} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Hora</label>
                <select className="form-control" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Precio (opcional, sobrescribe el del servicio)</label>
              <input type="number" className="form-control" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="Dejar vacío para usar el precio del servicio" />
            </div>

            <div className="form-group">
              <label>Notas</label>
              <textarea className="form-control" rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
            </div>

            {formError && <div className="login-error" role="alert" style={{ marginBottom: '1rem', padding: '.75rem', background: '#fee2e2', borderRadius: 'var(--radius)', color: '#991b1b', fontSize: '.875rem' }}>{formError}</div>}

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? <><span className="spinner" />Guardando…</> : editingCita ? 'Guardar cambios' : 'Crear cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reagendar */}
      {showReagendar && editingCita && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReagendar(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__header">
              <h2 className="modal__title">Reagendar cita</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReagendar(false)}>✕</button>
            </div>
            <p className={styles.subtext} style={{ marginBottom: '1rem' }}>
              Paciente: <strong>{editingCita.cliente.nombre}</strong>
            </p>
            <div className="form-group">
              <label>Nueva fecha</label>
              <input type="date" className="form-control" value={reagendarFecha.fecha} min={today()} onChange={e => setReagendar(r => ({ ...r, fecha: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Nueva hora</label>
              <select className="form-control" value={reagendarFecha.hora} onChange={e => setReagendar(r => ({ ...r, hora: e.target.value }))}>
                <option value="">Seleccionar…</option>
                {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowReagendar(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleReagendar} disabled={submitting}>
                {submitting ? <><span className="spinner" />Guardando…</> : 'Reagendar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar cancelación */}
      {showCancel && editingCita && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCancel(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__header">
              <h2 className="modal__title">Cancelar cita</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCancel(false)}>✕</button>
            </div>
            <p style={{ marginBottom: '1.5rem' }}>
              ¿Confirmas la cancelación de la cita de <strong>{editingCita.cliente.nombre}</strong> el{' '}
              {formatFecha(editingCita.fecha.split('T')[0])} a las {editingCita.hora}?
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowCancel(false)}>No, volver</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={submitting}>
                {submitting ? <><span className="spinner" />Cancelando…</> : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
