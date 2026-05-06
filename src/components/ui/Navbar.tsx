'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { href: '/',          label: 'Inicio'    },
  { href: '/nosotros',  label: 'Nosotros'  },
  { href: '/servicios', label: 'Servicios' },
  { href: '/citas',     label: 'Citas'     },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🦷</span>
          <span className={styles.logoText}>Dental <em>Company</em></span>
        </Link>

        <ul className={`${styles.links} ${open ? styles.linksOpen : ''}`}>
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`${styles.link} ${pathname === l.href ? styles.linkActive : ''}`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/citas" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
              Agendar cita
            </Link>
          </li>
        </ul>

        <button className={styles.burger} onClick={() => setOpen(o => !o)} aria-label="Menú">
          {open ? '✕' : '☰'}
        </button>
      </nav>
    </header>
  )
}
