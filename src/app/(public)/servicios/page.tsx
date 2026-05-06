import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP } from '@/lib/helpers'
import styles from './Servicios.module.css'

export const metadata: Metadata = {
  title:       'Servicios | Dental Company',
  description: 'Conoce todos los servicios odontológicos que ofrecemos: limpiezas, blanqueamientos, implantes, ortodoncia y más.',
}

export const revalidate = 3600 // revalidar cada hora

export default async function ServiciosPage() {
  const servicios = await prisma.servicio.findMany({
    where:   { activo: true },
    orderBy: { precio: 'asc' },
  })

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <h1>Nuestros servicios</h1>
          <p>Atención odontológica integral para toda la familia</p>
        </section>

        <div className={styles.grid}>
          {servicios.map(s => (
            <div key={s.id} className={`card ${styles.servicioCard}`}>
              <h2 className={styles.servicioNombre}>{s.nombre}</h2>
              {s.descripcion && <p className={styles.servicioDesc}>{s.descripcion}</p>}
              <div className={styles.servicioFooter}>
                <span className={styles.precio}>{formatCOP(s.precio)}</span>
                <span className={styles.duracion}>⏱ {s.duracion} min</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <h2>¿Tienes dudas sobre qué servicio necesitas?</h2>
          <p>Agenda una consulta general y nuestros especialistas te orientarán.</p>
          <Link href="/citas" className="btn btn-primary">Agendar consulta</Link>
        </div>
      </div>
    </div>
  )
}
