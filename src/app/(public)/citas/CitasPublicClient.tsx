'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { HORARIOS } from '@/lib/helpers'
import { validarNombre, validarCedula, validarTelefono, validarCorreo } from '@/lib/validators'
import './Appointments.css'

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

// ── Mini Calendar ──────────────────────────────────────────
function CalendarPicker({ selectedDate, onSelect }: { selectedDate: string; onSelect: (ymd: string) => void }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="cal">
      <div className="cal__header">
        <button type="button" className="cal__nav" onClick={prevMonth} aria-label="Mes anterior">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="cal__title">{MONTHS_ES[viewMonth]} {viewYear}</span>
        <button type="button" className="cal__nav" onClick={nextMonth} aria-label="Mes siguiente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="cal__weekdays">
        {DAYS_ES.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="cal__grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const date = new Date(viewYear, viewMonth, day)
          date.setHours(0, 0, 0, 0)
          const ymd        = toYMD(date)
          const isPast     = date < today
          const isSunday   = date.getDay() === 0
          const isSelected = selectedDate === ymd
          const disabled   = isPast || isSunday

          return (
            <button
              type="button"
              key={day}
              className={`cal__day${disabled ? ' cal__day--disabled' : ''}${isSelected ? ' cal__day--selected' : ''}`}
              disabled={disabled}
              onClick={() => !disabled && onSelect(ymd)}
              aria-label={`${day} de ${MONTHS_ES[viewMonth]}`}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="cal__legend">
        <span><span className="cal__dot cal__dot--available" />Disponible</span>
        <span><span className="cal__dot cal__dot--selected" />Seleccionado</span>
        <span><span className="cal__dot cal__dot--disabled" />No disponible</span>
      </div>
    </div>
  )
}

// ── Time Slot Picker ────────────────────────────────────────
function TimeSlotPicker({ selectedTime, onSelect, availableSlots }: {
  selectedTime: string
  onSelect: (h: string) => void
  availableSlots: string[] | null
}) {
  if (availableSlots === null) {
    return (
      <div className="slots slots--loading">
        <div className="slot-spinner" />
        Consultando disponibilidad…
      </div>
    )
  }

  return (
    <div className="slots">
      {HORARIOS.map(hora => {
        const available  = availableSlots.includes(hora)
        const isSelected = selectedTime === hora
        return (
          <button
            type="button"
            key={hora}
            className={`slot${!available ? ' slot--taken' : ''}${isSelected ? ' slot--selected' : ''}`}
            disabled={!available}
            onClick={() => available && onSelect(hora)}
          >
            {hora}
            {!available && <span className="slot__taken-label">Ocupado</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Step indicator ──────────────────────────────────────────
const WA_PHONE   = '573000000000'
const WA_MESSAGE = encodeURIComponent('Hola 👋 Me comunico desde la página web de Dental Company. Me gustaría agendar una cita. ¿Podrían indicarme disponibilidad? 🦷')

function StepBar({ step }: { step: number }) {
  const steps = ['Datos personales', 'Servicio', 'Fecha', 'Hora', 'Confirmación']
  const pct = Math.round((step / (steps.length - 1)) * 100)
  return (
    <div className="step-bar">
      <div className="step-bar__track" aria-hidden="true">
        <div className="step-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      {steps.map((label, i) => (
        <div key={i} className={`step-bar__item${step > i ? ' done' : ''}${step === i ? ' active' : ''}`}>
          <div className="step-bar__circle">
            {step > i ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            ) : i + 1}
          </div>
          <span className="step-bar__label">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────
interface Servicio { id: string; nombre: string; precio?: number | null }

const INITIAL_FORM = {
  nombre: '', cedula: '', telefono: '', correo: '',
  servicio_id: '', servicio: '', precio: 0,
  fecha: '', hora: '', notas: '',
}

export default function CitasPublicClient() {
  const [step,           setStep]           = useState(0)
  const [form,           setForm]           = useState(INITIAL_FORM)
  const [servicios,      setServicios]      = useState<Servicio[]>([])
  const [loadingServ,    setLoadingServ]    = useState(true)
  const [availableSlots, setAvailableSlots] = useState<string[] | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [success,        setSuccess]        = useState(false)
  const [error,          setError]          = useState('')
  const [fieldErrors,    setFieldErrors]    = useState<Record<string,string>>({})
  const slotVersionRef  = useRef(0)
  const submitInFlight  = useRef(false)

  // Cargar servicios al montar
  useEffect(() => {
    fetch('/api/servicios')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => setServicios(Array.isArray(data) ? data : []))
      .catch(err => {
        setServicios([])
        setError('No pudimos cargar los servicios: ' + (err?.message ?? 'Error desconocido'))
      })
      .finally(() => setLoadingServ(false))
  }, [])

  // Cargar slots disponibles cuando cambia la fecha
  useEffect(() => {
    if (!form.fecha) return
    setAvailableSlots(null)
    setForm(f => ({ ...f, hora: '' }))
    const version = ++slotVersionRef.current
    fetch(`/api/citas/disponibilidad?fecha=${form.fecha}`)
      .then(r => r.json())
      .then(data => {
        if (version === slotVersionRef.current) setAvailableSlots(data.disponibles ?? [])
      })
      .catch(() => {
        if (version === slotVersionRef.current) {
          setAvailableSlots([])
          setError('No pudimos consultar disponibilidad. Intenta de nuevo.')
        }
      })
  }, [form.fecha])

  const update = (field: string, value: string | number) => setForm(f => ({ ...f, [field]: value }))

  const selectServicio = (s: Servicio) => {
    setForm(f => ({ ...f, servicio_id: s.id, servicio: s.nombre, precio: s.precio ?? 0 }))
  }

  const isNombreValid   = () => !validarNombre(form.nombre) && !!form.nombre.trim()
  const isCedulaValid   = () => !!form.cedula.trim() && !validarCedula(form.cedula)
  const isTelefonoValid = () => !!form.telefono.trim() && !validarTelefono(form.telefono)
  const isCorreoValid   = () => !validarCorreo(form.correo)

  const validateStep0 = () => {
    const errs: Record<string,string> = {}
    if (!isNombreValid())   errs.nombre   = 'Nombre inválido (mínimo 2 letras)'
    if (!isCedulaValid())   errs.cedula   = 'Cédula inválida (6–12 dígitos)'
    if (!isTelefonoValid()) errs.telefono = 'Teléfono inválido (10 dígitos)'
    if (!isCorreoValid())   errs.correo   = 'Correo inválido'
    return errs
  }

  const canAdvance = () => {
    if (step === 0) return isNombreValid() && isCedulaValid() && isTelefonoValid() && isCorreoValid()
    if (step === 1) return !!form.servicio_id
    if (step === 2) return !!form.fecha
    if (step === 3) return !!form.hora
    return true
  }

  const handleNext = () => {
    if (step === 0) {
      const errs = validateStep0()
      if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
      setFieldErrors({})
    }
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (submitInFlight.current) return
    submitInFlight.current = true
    setLoading(true)
    setError('')
    try {
      const clienteRes = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:   form.nombre.trim(),
          cedula:   form.cedula.trim(),
          telefono: form.telefono.trim(),
          correo:   form.correo.trim() || null,
        }),
      })
      if (!clienteRes.ok) throw new Error('No se pudo registrar el paciente. Intenta de nuevo.')
      const cliente = await clienteRes.json()
      if (!cliente?.id) throw new Error('No se pudo registrar el paciente. Intenta de nuevo.')

      const citaRes = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId:  cliente.id,
          servicioId: form.servicio_id,
          fecha:      form.fecha,
          hora:       form.hora,
          precio:     form.precio,
          notas:      form.notas.trim() || null,
        }),
      })
      if (!citaRes.ok) {
        const body = await citaRes.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Error al registrar la cita')
      }

      setSuccess(true)
    } catch (e: unknown) {
      const msg = (e as Error).message ?? ''
      if (msg.includes('horario') || msg.includes('ocupado')) {
        setError('Ese horario ya fue tomado. Por favor elige otra hora.')
      } else {
        setError(msg || 'Hubo un problema al registrar tu cita. Intenta de nuevo.')
      }
    } finally {
      submitInFlight.current = false
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="appointments">
        <div className="container appt-wrap">
          <div className="appt-success animate-fade-up">
            <div className="appt-success__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2>¡Cita registrada!</h2>
            <p>
              Gracias <strong>{form.nombre}</strong>, tu cita para <strong>{form.servicio}</strong> el{' '}
              <strong>{form.fecha}</strong> a las <strong>{form.hora}</strong> ha sido registrada.
            </p>
            <p className="appt-success__note">
              Te contactaremos al {form.telefono} para confirmar tu cita.
              {form.correo && ` También te enviaremos un recordatorio a ${form.correo}.`}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => { setSuccess(false); setForm(INITIAL_FORM); setStep(0) }}>
              Agendar otra cita
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="appointments">
      <div className="appt-hero">
        <div className="container">
          <p className="section-label">Reserva en línea</p>
          <h1 className="appt-hero__title">Agenda tu cita</h1>
          <p className="appt-hero__sub">Completa el formulario en pocos pasos y asegura tu espacio.</p>
        </div>
      </div>

      <div className="container appt-wrap">
        <StepBar step={step} />

        <div className="appt-card animate-fade-up">

          {/* STEP 0 – Datos personales */}
          {step === 0 && (
            <div className="appt-step">
              <h2>Datos personales</h2>
              <p className="appt-step__sub">Necesitamos estos datos para registrar tu cita correctamente.</p>
              <div className="appt-fields">
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input type="text" placeholder="Tu nombre completo" value={form.nombre} maxLength={100}
                    onChange={e => update('nombre', e.target.value)} />
                  {fieldErrors.nombre && <span className="field-error">{fieldErrors.nombre}</span>}
                </div>
                <div className="form-group">
                  <label>Número de cédula *</label>
                  <input type="text" placeholder="Ej: 1234567890" value={form.cedula} maxLength={12} inputMode="numeric"
                    onChange={e => update('cedula', e.target.value.replace(/\D/g, ''))} />
                  {fieldErrors.cedula && <span className="field-error">{fieldErrors.cedula}</span>}
                </div>
                <div className="form-group">
                  <label>Teléfono / WhatsApp *</label>
                  <input type="tel" placeholder="Ej: 3001234567" value={form.telefono} maxLength={10} inputMode="numeric"
                    onChange={e => update('telefono', e.target.value.replace(/\D/g, ''))} />
                  {fieldErrors.telefono && <span className="field-error">{fieldErrors.telefono}</span>}
                </div>
                <div className="form-group">
                  <label>Correo electrónico <span>(opcional)</span></label>
                  <input type="email" placeholder="tu@correo.com" value={form.correo} maxLength={150}
                    onChange={e => update('correo', e.target.value)} />
                  {fieldErrors.correo && <span className="field-error">{fieldErrors.correo}</span>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 – Servicio */}
          {step === 1 && (
            <div className="appt-step">
              <h2>Selecciona el servicio</h2>
              <p className="appt-step__sub">¿Qué tratamiento necesitas?</p>
              {loadingServ ? (
                <div style={{ color: 'var(--text-3)', padding: '1rem 0' }}>Cargando servicios…</div>
              ) : servicios.length === 0 ? (
                <div style={{ color: '#dc3545', padding: '1rem 0', fontSize: '0.9rem' }}>
                  {error || 'No hay servicios disponibles en este momento. Contáctanos por WhatsApp.'}
                </div>
              ) : (
                <div className="service-options">
                  {servicios.map(s => (
                    <button
                      type="button"
                      key={s.id}
                      className={`service-opt${form.servicio_id === s.id ? ' service-opt--selected' : ''}`}
                      onClick={() => selectServicio(s)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      {s.nombre}
                      {form.servicio_id === s.id && (
                        <svg className="service-opt__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Notas adicionales <span>(opcional)</span></label>
                <textarea rows={3} maxLength={500}
                  placeholder="¿Tienes alguna preocupación específica o quieres que sepamos algo antes de tu cita?"
                  value={form.notas} onChange={e => update('notas', e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 2 – Fecha */}
          {step === 2 && (
            <div className="appt-step">
              <h2>Elige la fecha</h2>
              <p className="appt-step__sub">Selecciona el día que mejor se adapte a tu agenda. Los domingos no hay atención.</p>
              <CalendarPicker selectedDate={form.fecha} onSelect={date => update('fecha', date)} />
            </div>
          )}

          {/* STEP 3 – Hora */}
          {step === 3 && (
            <div className="appt-step">
              <h2>Elige la hora</h2>
              <p className="appt-step__sub">
                Horarios disponibles para el{' '}
                <strong>
                  {form.fecha ? new Date(form.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                </strong>
              </p>
              <TimeSlotPicker
                selectedTime={form.hora}
                onSelect={h => { update('hora', h); setError('') }}
                availableSlots={availableSlots}
              />
            </div>
          )}

          {/* STEP 4 – Confirmación */}
          {step === 4 && (
            <div className="appt-step">
              <h2>Confirmar cita</h2>
              <p className="appt-step__sub">Revisa los datos antes de enviar.</p>
              <div className="summary">
                {[
                  { label: 'Nombre',   value: form.nombre },
                  { label: 'Cédula',   value: form.cedula },
                  { label: 'Teléfono', value: form.telefono },
                  { label: 'Correo',   value: form.correo || '—' },
                  { label: 'Servicio', value: form.servicio },
                  { label: 'Fecha',    value: new Date(form.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'Hora',     value: form.hora },
                  { label: 'Notas',    value: form.notas || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="summary__row">
                    <span className="summary__label">{label}</span>
                    <span className="summary__value">{value}</span>
                  </div>
                ))}
              </div>
              {error && <p className="appt-error">{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="appt-nav">
            {step > 0 && (
              <button type="button" className="btn btn-ghost appt-nav__back" onClick={() => { setStep(s => s - 1); setError('') }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Atrás
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 4 ? (
              <button type="button" className="btn btn-primary" disabled={!canAdvance()} onClick={handleNext}>
                Continuar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ) : (
              <button type="button" className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
                {loading ? 'Enviando…' : 'Confirmar cita'}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info panel */}
        <aside className="appt-info animate-fade-up delay-2">
          <div className="appt-info__card">
            <h3>Información importante</h3>
            <ul>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                Llega 10 minutos antes de tu cita.
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                Trae tu documento de identidad.
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                Para cancelar, contáctanos mínimo 24 horas antes.
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                Te llamaremos para confirmar tu cita.
              </li>
            </ul>
          </div>

          <div className="appt-info__card appt-info__wa">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <div>
              <p className="appt-info__wa-title">¿Prefieres por WhatsApp?</p>
              <p>Nuestro chatbot también puede ayudarte a agendar tu cita.</p>
              <a href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                Escribir ahora
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
