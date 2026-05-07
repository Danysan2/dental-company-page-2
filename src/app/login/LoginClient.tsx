'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { useAuth }             from '@/context/AuthContext'
import './Login.css'

export default function LoginClient() {
  const { login, user, loading } = useAuth()
  const router = useRouter()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!loading && user) router.replace('/admin/dashboard')
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      router.replace('/admin/dashboard')
    } catch (err: unknown) {
      const msg = (err as Error).message ?? ''
      const messages: Record<string, string> = {
        'Credenciales incorrectas': 'Correo o contraseña incorrectos.',
        'invalid_credentials':      'Correo o contraseña incorrectos.',
        'user_not_found':           'No existe una cuenta con este correo.',
        'too_many_requests':        'Demasiados intentos. Espera unos minutos.',
        'network_error':            'Sin conexión. Verifica tu internet.',
      }
      setError(messages[msg] ?? `Error al iniciar sesión. Verifica tus datos. (${msg || 'desconocido'})`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-page__bg" aria-hidden="true">
          <div className="login-bg-blob login-bg-blob--1" />
          <div className="login-bg-blob login-bg-blob--2" />
        </div>
        <div className="login-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <span className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-page__bg" aria-hidden="true">
        <div className="login-bg-blob login-bg-blob--1" />
        <div className="login-bg-blob login-bg-blob--2" />
      </div>

      {/* Card */}
      <div className="login-card animate-fade-up">
        {/* Header */}
        <div className="login-card__header">
          <Link href="/" className="login-logo">
            <img src="/logo-png.png" alt="Dental Company" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            <span className="login-logo__text">
              Dental <em>Company</em>
            </span>
          </Link>
          <p className="login-card__subtitle">Área de Staff — Acceso restringido</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h1 className="login-form__title">Iniciar sesión</h1>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                id="email"
                type="email"
                placeholder="tu@olinky.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-icon input-with-icon--right">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={submitting || !email || !password}
          >
            {submitting ? (
              <>
                <span className="btn-spinner" />
                Ingresando…
              </>
            ) : (
              <>
                Ingresar al sistema
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-card__footer">
          <Link href="/" className="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Volver al sitio web
          </Link>
          <p className="login-card__note">Solo para uso del personal de la clínica.</p>
        </div>
      </div>

      {/* Roles info — solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="login-roles animate-fade-up delay-2">
          <div className="login-role">
            <div className="login-role__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <span className="login-role__title">Doctora</span>
              <span className="login-role__label">doctora@olinky.com</span>
            </div>
          </div>
          <div className="login-role">
            <div className="login-role__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div>
              <span className="login-role__title">Recepcionista</span>
              <span className="login-role__label">recepcion@olinky.com</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
