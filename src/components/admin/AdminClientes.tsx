'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/apiFetch'
import { formatFecha, formatCOP } from '@/lib/helpers'
import { ESTADOS } from '@/lib/helpers'
import { useToast } from '@/context/ToastContext'
import styles from './AdminClientes.module.css'

interface Cita {
  id:       string
  fecha:    string
  hora:     string
  estado:   string
  servicio: { nombre: string }
  precio?:  number | null
}

interface Cliente {
  id:       string
  nombre:   string
  cedula?:  string | null
  telefono?:string | null
  correo?:  string | null
  notas?:   string | null
  citas?:   Cita[]
}

const emptyForm = { nombre: '', cedula: '', telefono: '', correo: '', notas: '' }

export default function AdminClientes() {
  const { toast } = useToast()

  const [clientes,   setClientes]   = useState<Cliente[]>([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)
  const [editing,    setEditing]    = useState<Cliente | null>(null)
  const [historial,  setHistorial]  = useState<Cliente | null>(null)
  const [form,       setForm]       = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError,  setFormError]  = useState('')

  const loadClientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : ''
      const data   = await api.get<Cliente[]>(`/api/clientes${params}`)
      setClientes(data)
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }, [query, toast])

  useEffect(() => { loadClientes() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setForm({ nombre: c.nombre, cedula: c.cedula ?? '', telefono: c.telefono ?? '', correo: c.correo ?? '', notas: c.notas ?? '' })
    setFormError('')
    setShowModal(true)
  }

  async function openHistorial(c: Cliente) {
    try {
      const data = await api.get<Cliente>(`/api/clientes/${c.id}`)
      setHistorial(data)
      setShowHistorial(true)
    } catch (err: unknown) {
      toast((err as Error).message, 'error')
    }
  }

  async function handleSave() {
    setFormError('')
    if (!form.nombre.trim()) { setFormError('El nombre es requerido'); return }
    setSubmitting(true)
    try {
      if (editing) {
        await api.put(`/api/clientes/${editing.id}`, form)
        toast('Cliente actualizado', 'success')
      } else {
        await api.post('/api/clientes', form)
        toast('Cliente creado', 'success')
      }
      setShowModal(false)
      loadClientes()
    } catch (err: unknown) {
      setFormError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo cliente</button>
      </header>

      <div className={`card ${styles.searchBar}`}>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre, cédula, teléfono o correo…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadClientes()}
        />
        <button className="btn btn-outline btn-sm" onClick={loadClientes}>Buscar</button>
      </div>

      <div className="card">
        {loading ? (
          <div className={styles.loading}><div className="spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} /></div>
        ) : clientes.length === 0 ? (
          <p className={styles.empty}>No se encontraron clientes</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nombre}</strong></td>
                    <td>{c.cedula ?? '—'}</td>
                    <td>{c.telefono ?? '—'}</td>
                    <td>{c.correo ?? '—'}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Editar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openHistorial(c)}>Historial</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label>Nombre completo *</label>
                <input type="text" className="form-control" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Cédula</label>
                <input type="text" className="form-control" value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Teléfono</label>
                <input type="text" className="form-control" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label>Correo electrónico</label>
                <input type="email" className="form-control" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label>Notas</label>
                <textarea className="form-control" rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>

            {formError && (
              <div style={{ margin: '1rem 0', padding: '.75rem', background: '#fee2e2', borderRadius: 'var(--radius)', color: '#991b1b', fontSize: '.875rem' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? <><span className="spinner" />Guardando…</> : editing ? 'Guardar cambios' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historial */}
      {showHistorial && historial && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowHistorial(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal__header">
              <h2 className="modal__title">Historial: {historial.nombre}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistorial(false)}>✕</button>
            </div>

            <div className={styles.historialInfo}>
              {historial.cedula   && <span><strong>CC:</strong> {historial.cedula}</span>}
              {historial.telefono && <span><strong>Tel:</strong> {historial.telefono}</span>}
              {historial.correo   && <span><strong>Email:</strong> {historial.correo}</span>}
            </div>

            {(!historial.citas || historial.citas.length === 0) ? (
              <p className={styles.empty}>Este paciente no tiene citas registradas</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Servicio</th>
                      <th>Precio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.citas!.map(c => (
                      <tr key={c.id}>
                        <td>{formatFecha(c.fecha.split('T')[0])}</td>
                        <td>{c.hora}</td>
                        <td>{c.servicio.nombre}</td>
                        <td>{c.precio ? formatCOP(c.precio) : '—'}</td>
                        <td><span className={`badge badge-${c.estado}`}>{ESTADOS.find(e => e.value === c.estado)?.label ?? c.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setShowHistorial(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
