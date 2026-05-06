import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>🦷 Dental <em>Company</em></span>
          <p className={styles.tagline}>Tu salud dental, nuestra prioridad.</p>
        </div>
        <nav className={styles.links}>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/servicios">Servicios</Link>
          <Link href="/citas">Citas</Link>
          <Link href="/login">Staff</Link>
        </nav>
        <p className={styles.copy}>© {year} Dental Company. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
