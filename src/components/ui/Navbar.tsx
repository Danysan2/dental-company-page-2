'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './Navbar.css'

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link href="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <img src="/logo-png.png" alt="Dental Company" className="navbar__logo-img" />
          <span className="navbar__logo-text">
            Dental <em>Company</em>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar__links">
          <Link href="/"               className={pathname === '/'               ? 'active' : ''}>Inicio</Link>
          <Link href="/sobre-nosotros" className={pathname === '/sobre-nosotros' ? 'active' : ''}>Nosotros</Link>
          <Link href="/citas"          className={pathname === '/citas'          ? 'active' : ''}>Citas</Link>
          <Link href="/login" className="btn btn-primary navbar__cta">Iniciar sesión</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className={`navbar__burger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="navbar__mobile" onClick={() => setMenuOpen(false)}>
          <Link href="/">Inicio</Link>
          <Link href="/sobre-nosotros">Nosotros</Link>
          <Link href="/citas">Agendar Cita</Link>
          <Link href="/login" className="mobile-login-btn">Iniciar sesión</Link>
        </nav>
      )}
    </header>
  )
}
