'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AdminError]', error)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center',
      gap: '1rem',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #896646)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 400 }}>Error en el panel</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #888)', maxWidth: 320 }}>
        No se pudo cargar esta sección. Intenta de nuevo o regresa al dashboard.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={reset} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
          Reintentar
        </button>
        <Link href="/admin/dashboard" className="btn" style={{ fontSize: '0.875rem', background: 'var(--color-warm-2)', color: 'var(--color-dark)' }}>
          Ir al dashboard
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre style={{
          marginTop: '0.75rem',
          padding: '0.6rem 0.9rem',
          background: '#fff5f5',
          border: '1px solid #fecaca',
          borderRadius: 8,
          fontSize: '0.72rem',
          color: '#991b1b',
          maxWidth: 500,
          overflowX: 'auto',
          textAlign: 'left',
        }}>
          {error.message}
        </pre>
      )}
    </div>
  )
}
