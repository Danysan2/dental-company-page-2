import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: 'inherit',
    }}>
      <p style={{ fontSize: '5rem', fontWeight: 700, color: 'var(--primary, #b5833a)', lineHeight: 1, margin: 0 }}>
        404
      </p>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', color: '#1a1a2e' }}>
        Página no encontrada
      </h1>
      <p style={{ color: '#666', maxWidth: '380px', marginBottom: '2rem', lineHeight: 1.6 }}>
        La página que buscas no existe o fue movida. Si crees que esto es un error, contáctanos.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '0.65rem 1.5rem',
            background: 'var(--primary, #b5833a)',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          Ir al inicio
        </Link>
        <Link
          href="/citas"
          style={{
            padding: '0.65rem 1.5rem',
            border: '2px solid var(--primary, #b5833a)',
            color: 'var(--primary, #b5833a)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          Agendar cita
        </Link>
      </div>
    </main>
  )
}
