'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
// import { useTheme } from '@/hooks/useTheme'
import './AdminShell.css'

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/admin/citas',
    label: 'Citas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/clientes',
    label: 'Clientes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
]

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="16" height="16">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="16" height="16">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [sideOpen, setSideOpen] = useState(false)
  // const { dark, toggle } = useTheme()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--c-accent)', borderColor: 'var(--c-warm-2)' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="admin-wrap">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sideOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__logo">
            <Image src="/logo-png.png" alt="Dental Company" width={100} height={30} style={{ height: 30, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <div className="admin-sidebar__logo-text">
              <span>Dental</span>
              <em>Company</em>
            </div>
          </div>
          <div className="admin-sidebar__top-right">
            {/* theme toggle — en standby
            <button
              className="admin-theme-toggle"
              onClick={toggle}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            */}
            <span className="admin-sidebar__badge">
              {user.rol === 'doctora' ? 'Doctora' : 'Recepcionista'}
            </span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <p className="admin-sidebar__nav-label">Menú principal</p>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${pathname === item.href ? 'admin-nav-item--active' : ''}`}
              onClick={() => setSideOpen(false)}
            >
              <span className="admin-nav-item__icon">{item.icon}</span>
              <span className="admin-nav-item__label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__bottom">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">
              {(user.nombre ?? 'U')[0].toUpperCase()}
            </div>
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">
                {user.rol === 'doctora' ? (user.nombre ?? 'Doctora') : 'Recepcionista'}
              </span>
              <span className="admin-sidebar__user-role">{user.email ?? ''}</span>
            </div>
          </div>
          <button className="admin-sidebar__logout" onClick={handleLogout} title="Cerrar sesión">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sideOpen && <div className="admin-overlay" onClick={() => setSideOpen(false)} />}

      {/* ── Main ── */}
      <div className="admin-main">
        {/* Top bar (mobile) */}
        <header className="admin-topbar">
          <button className="admin-topbar__burger" onClick={() => setSideOpen(true)} aria-label="Menú">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="admin-topbar__logo-mobile">
            <Image src="/logo-png.png" alt="Dental Company" width={80} height={26} style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--f-display)', fontSize: '0.95rem', color: 'var(--text)' }}>Dental Company</span>
          </div>
          <div className="admin-topbar__actions">
            {/* theme toggle — en standby
            <button
              className="admin-theme-toggle"
              onClick={toggle}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            */}
            <button className="admin-topbar__logout-mobile" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}