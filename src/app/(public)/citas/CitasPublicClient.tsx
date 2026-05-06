'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/apiFetch'
import { today, daysFromNow, formatFechaLarga, formatCOP } from '@/lib/helpers'
import { enviarCorreosCita } from '@/lib/emailService'
import { validarNombre, validarTelefono, validarCorreo } from '@/lib/validators'
import styles from './Citas.module.css'

interface Servicio { id: string; nombre: string; precio: number; duracion: number; descripcion?: string | null }
interface Disponibilidad { disponibles: string[] }

type Step = 1 | 2 | 3 | 4

export default function CitasPublicClient() {
  const [step, setStep] = useState<Step>(1)

  // Step 1 — Datos personales
  const [nombre,   setNombre]   = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo,   setCorreo]   = useState('')
  const [cedula,   setCedula]   = useState('')

  // Step 2 — Servicio
  const [servicios,   setServicios]   = useState<Servicio[]>([])
  const [servicioSel, setServicioSel] = useState<Servicio | null>(null)

  // Step 3 — Fecha y hora
  const [fecha,          setFecha]          = useState('')
  const [hora,           setHora]           = useState('')
  const [disponibles,    setDisponibles]    = useState<string[]>([])
  const [loadingHoras,   setLoadingHoras]   = useState(false)

  // General
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    api.get<Servicio[]>('/api/servicios').then(setServicios).catch(() => {})
  }, [])

  useEffect(() => {
    if (!fecha) { setDisponibles([]); return }
    setLoadingHoras(true)
    api.get<Disponibilidad>(`/api/citas/disponibilidad?fecha=${fecha}`)
      .then(d => setDisponibles(d.disponibles))
      .catch(() => setDisponibles([]))
      .finally(() => setLoadingHoras(false))
  }, [fecha])

  function validateStep1() {
    if (!nombre.trim()) return 'Tu nombre es requerido'
    const en = validarNombre(nombre)
    if (en) return en
    const et = validarTelefono(telefono)
    if (et) return et
    const ec = validarCorreo(correo)
    if (ec) return ec
    return null
  }

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      // Buscar o crear cliente
      const clienteData = await api.post<{ id: string; nombre: string; correo?: string | null; telefono?: string | null }>(
        '/api/clientes',
        { nombre: nombre.trim(), telefono: telefono.trim() || null, correo: correo.trim() || null, cedula: cedula.trim() || null }
      )

      await api.post('/api/citas', {
        clienteId:  clienteData.id,
        servicioId: servicioSel!.id,
        fecha,
        hora,
        precio:     servicioSel!.precio,
      })

      // Email confirmación en background
      enviarCorreosCita({
        nombrePaciente: nombre,
        correo:         correo || null,
        telefono:       telefono || null,
        servicio:       servicioSel!.nombre,
        fecha:          formatFechaLarga(fecha),
        hora,
      }).catch(() => {})

      setStep(4)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1>Agenda tu cita</h1>
          <p>Reserva en línea en menos de 2 minutos</p>
        </div>

        {/* Stepper */}
        {step < 4 && (
          <div className={styles.stepper}>
            {(['Tus datos', 'Servicio', 'Fecha y hora'] as const).map((label, i) => (
              <div key={i} className={`${styles.stepItem} ${step === i+1 ? styles.stepActive : step > i+1 ? styles.stepDone : ''}`}>
                <div className={styles.stepCircle}>{step > i+1 ? '✓' : i+1}</div>
                <span className={styles.stepLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`card ${styles.formCard}`}>
          {/* Step 1 — Datos */}
          {step === 1 && (
            <div>
              <h2 className={styles.stepTitle}>Tus datos personales</h2>
              <div className={styles.grid2}>
                <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                  <label>Nombre completo *</label>
                  <input type="text" className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="María García" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Cédula</label>
                  <input type="text" className="form-control" value={cedula} onChange={e => setCedula(e.target.value)} placeholder="1234567890" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Teléfono</label>
                  <input type="tel" className="form-control" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="300 123 4567" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                  <label>Correo electrónico (para confirmación)</label>
                  <input type="email" className="form-control" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="tu@correo.com" />
                </div>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.btnRow}>
                <button className="btn btn-primary" onClick={() => { const e = validateStep1(); if(e){ setError(e); return; } setError(''); setStep(2) }}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Servicio */}
          {step === 2 && (
            <div>
              <h2 className={styles.stepTitle}>Selecciona un servicio</h2>
              <div className={styles.serviciosGrid}>
                {servicios.map(s => (
                  <button
                    key={s.id}
                    className={`${styles.servicioBtn} ${servicioSel?.id === s.id ? styles.servicioBtnActive : ''}`}
                    onClick={() => setServicioSel(s)}
                  >
                    <strong>{s.nombre}</strong>
                    <span className={styles.precio}>{formatCOP(s.precio)}</span>
                    {s.descripcion && <span className={styles.desc}>{s.descripcion}</span>}
                  </button>
                ))}
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.btnRow}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
                <button className="btn btn-primary" disabled={!servicioSel} onClick={() => { setError(''); setStep(3) }}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Fecha y hora */}
          {step === 3 && (
            <div>
              <h2 className={styles.stepTitle}>Selecciona fecha y hora</h2>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" className="form-control" value={fecha} min={today()} max={daysFromNow(60)} onChange={e => { setFecha(e.target.value); setHora('') }} style={{ maxWidth: 280 }} />
              </div>
              {fecha && (
                <div className="form-group">
                  <label>Hora disponible</label>
                  {loadingHoras ? (
                    <p className={styles.hint}>Cargando horarios…</p>
                  ) : disponibles.length === 0 ? (
                    <p className={styles.hint}>No hay horarios disponibles para esta fecha. Elige otro día.</p>
                  ) : (
                    <div className={styles.horasGrid}>
                      {disponibles.map(h => (
                        <button key={h} className={`${styles.horaBtn} ${hora === h ? styles.horaBtnActive : ''}`} onClick={() => setHora(h)}>
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {fecha && hora && servicioSel && (
                <div className={styles.resumen}>
                  <h3>Resumen de tu cita</h3>
                  <div><span>Paciente:</span> <strong>{nombre}</strong></div>
                  <div><span>Servicio:</span> <strong>{servicioSel.nombre}</strong></div>
                  <div><span>Fecha:</span>    <strong>{formatFechaLarga(fecha)}</strong></div>
                  <div><span>Hora:</span>     <strong>{hora}</strong></div>
                  <div><span>Valor:</span>    <strong>{formatCOP(servicioSel.precio)}</strong></div>
                </div>
              )}

              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.btnRow}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Atrás</button>
                <button className="btn btn-primary" disabled={!fecha || !hora || submitting} onClick={handleSubmit}>
                  {submitting ? <><span className="spinner" />Agendando…</> : 'Confirmar cita'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Éxito */}
          {step === 4 && (
            <div className={styles.success}>
              <div className={styles.successIcon}>✅</div>
              <h2>¡Cita agendada!</h2>
              <p>Tu cita ha sido registrada exitosamente. {correo && 'Te enviaremos un correo de confirmación.'}</p>
              {servicioSel && (
                <div className={styles.resumen} style={{ maxWidth: 360, margin: '0 auto' }}>
                  <div><span>Servicio:</span> <strong>{servicioSel.nombre}</strong></div>
                  <div><span>Fecha:</span>    <strong>{formatFechaLarga(fecha)}</strong></div>
                  <div><span>Hora:</span>     <strong>{hora}</strong></div>
                </div>
              )}
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => { setStep(1); setNombre(''); setTelefono(''); setCorreo(''); setCedula(''); setServicioSel(null); setFecha(''); setHora('') }}>
                Agendar otra cita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
