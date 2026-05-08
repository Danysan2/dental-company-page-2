'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--color-bg, #F7F6F5)',
      textAlign: 'center',
      gap: '1rem',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #896646)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-dark, #3D3C3B)' }}>
        Algo salió mal
      </h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #888)', maxWidth: 360 }}>
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ fontSize: '0.875rem' }}
        >
          Intentar de nuevo
        </button>
        <Link href="/" className="btn" style={{ fontSize: '0.875rem', background: 'var(--color-warm-2)', color: 'var(--color-dark)' }}>
          Ir al inicio
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: '#fff5f5',
          border: '1px solid #fecaca',
          borderRadius: 8,
          fontSize: '0.75rem',
          color: '#991b1b',
          maxWidth: 560,
          overflowX: 'auto',
          textAlign: 'left',
        }}>
          {error.message}
        </pre>
      )}
    </div>
  )
}
