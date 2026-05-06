'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './AdminShell.module.css'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard',  icon: '📊' },
  { href: '/admin/citas',     label: 'Citas',       icon: '📅' },
  { href: '/admin/clientes',  label: 'Clientes',    icon: '👥' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🦷</span>
          <span className={styles.logoText}>Dental<em>Co</em></span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.nombre}</span>
            <span className={styles.userRole}>{user.rol}</span>
          </div>
          <button
            className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}
            onClick={async () => { await logout(); router.replace('/login') }}
          >
            Salir
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
