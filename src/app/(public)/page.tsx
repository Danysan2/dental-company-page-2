import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './Home.module.css'

export const metadata: Metadata = {
  title:       'Dental Company — Clínica Odontológica',
  description: 'Tu salud dental en manos expertas. Agenda tu cita hoy y descubre nuestros servicios de odontología.',
}

const SERVICIOS_HERO = [
  { icon: '🦷', titulo: 'Limpieza Dental',     desc: 'Profilaxis profesional para mantener tu sonrisa saludable.' },
  { icon: '⚡', titulo: 'Blanqueamiento',       desc: 'Recupera el brillo natural de tu sonrisa.' },
  { icon: '🔧', titulo: 'Ortodoncia',           desc: 'Brackets y alineadores para una mordida perfecta.' },
  { icon: '🛡️', titulo: 'Implantes',            desc: 'Solución permanente para dientes perdidos.' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🦷 Tu clínica de confianza</span>
          <h1 className={styles.heroTitle}>
            Sonríe con<br />
            <em>confianza</em>
          </h1>
          <p className={styles.heroDesc}>
            En Dental Company cuidamos tu salud bucal con tecnología de punta
            y los mejores especialistas de la región.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/citas" className="btn btn-primary">Agendar cita</Link>
            <Link href="/servicios" className="btn btn-outline">Ver servicios</Link>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className={styles.servicios}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Nuestros servicios</h2>
          <div className={styles.serviciosGrid}>
            {SERVICIOS_HERO.map(s => (
              <div key={s.titulo} className={`card ${styles.servicioCard}`}>
                <span className={styles.servicioIcon}>{s.icon}</span>
                <h3 className={styles.servicioTitle}>{s.titulo}</h3>
                <p className={styles.servicioDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className={styles.sectionCta}>
            <Link href="/servicios" className="btn btn-outline">Ver todos los servicios</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>¿Listo para una sonrisa perfecta?</h2>
          <p>Agenda tu cita en línea — es rápido, fácil y gratis.</p>
          <Link href="/citas" className="btn btn-primary">Agendar mi cita</Link>
        </div>
      </section>
    </>
  )
}
