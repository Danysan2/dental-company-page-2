'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import styles from './Login.module.css'

function LoginForm() {
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
      const msg = (err as Error).message
      const messages: Record<string, string> = {
        'Credenciales incorrectas': 'Correo o contraseña incorrectos.',
      }
      setError(messages[msg] ?? msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className={styles.loading}><div className="spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)', width: 32, height: 32 }} /></div>

  return (
    <div className={styles.page}>
      <div className={`${styles.bg}`} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      <div className={`${styles.card}`}>
        <div className={styles.cardHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🦷</span>
            <span className={styles.logoText}>Dental <em>Company</em></span>
          </Link>
          <p className={styles.subtitle}>Área de Staff — Acceso restringido</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h1 className={styles.formTitle}>Iniciar sesión</h1>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="usuario@olinky.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className={styles.passWrapper}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className={styles.togglePass} onClick={() => setShowPass(p => !p)} aria-label={showPass ? 'Ocultar' : 'Mostrar'}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <button type="submit" className={`btn btn-primary w-full`} disabled={submitting || !email || !password}>
            {submitting ? <><span className="spinner" />Ingresando…</> : 'Ingresar al sistema'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/" className={styles.backLink}>← Volver al sitio web</Link>
          <p className={styles.note}>Solo para uso del personal de la clínica.</p>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className={styles.devHint}>
          <div><strong>Doctora:</strong> doctora@olinky.com</div>
          <div><strong>Recepción:</strong> recepcion@olinky.com</div>
          <div><strong>Pass:</strong> Olinky2026!</div>
        </div>
      )}
    </div>
  )
}

export default function LoginClient() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  )
}
