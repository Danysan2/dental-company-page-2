'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './Servicios.module.css'

interface ServicioData {
  nombre: string
  descripcion: string
  icon: string
  subservicios: string[]
}

const SERVICIOS: ServicioData[] = [
  {
    nombre: 'Rehabilitación Oral y Estética Dental',
    descripcion: 'Restauramos y diseñamos sonrisas con materiales de última generación, logrando resultados naturales, armónicos y duraderos.',
    icon: '✦',
    subservicios: [
      'Diseños de sonrisa en cerámica: carillas cerámicas y lentes cerámicos',
      'Diseños de sonrisa en resina de alta estética',
      'Carillas directas e indirectas',
      'Incrustaciones (inlays/onlays)',
      'Coronas totalmente cerámicas y metal-cerámica',
      'Prótesis fijas',
      'Prótesis sobre implantes',
      'Prótesis totales',
      'Prótesis removibles',
    ],
  },
  {
    nombre: 'Manejo de la Articulación Temporomandibular (ATM)',
    descripcion: 'Enfoque especializado en el diagnóstico y tratamiento del dolor orofacial.',
    icon: '◎',
    subservicios: [
      'Trastornos de la ATM',
      'Placas neuromiorelajantes de alta precisión',
    ],
  },
  {
    nombre: 'Endodoncia',
    descripcion: 'Tratamientos enfocados en la conservación dental y alivio del dolor.',
    icon: '⚕',
    subservicios: [
      'Endodoncia en dientes unirradiculares y multirradiculares',
      'Retratamientos endodónticos',
      'Manejo de infecciones pulpares',
    ],
  },
  {
    nombre: 'Periodoncia',
    descripcion: 'Salud y mantenimiento de los tejidos de soporte dental.',
    icon: '❋',
    subservicios: [
      'Tratamiento de enfermedad periodontal (gingivitis y periodontitis)',
      'Frenilectomías',
      'Terapias de mantenimiento periodontal',
    ],
  },
  {
    nombre: 'Ortodoncia',
    descripcion: 'Soluciones modernas para la alineación dental y estética de la sonrisa.',
    icon: '⬡',
    subservicios: [
      'Ortodoncia convencional',
      'Ortodoncia de autoligado',
      'Ortodoncia estética (brackets de zafiro)',
      'Ortodoncia invisible (alineadores transparentes)',
    ],
  },
  {
    nombre: 'Odontología General',
    descripcion: 'Prevención y restauración con enfoque estético.',
    icon: '⊕',
    subservicios: [
      'Restauraciones en resina de alta estética',
      'Reemplazo de amalgamas por materiales estéticos',
      'Tratamientos preventivos y de mantenimiento',
    ],
  },
]

export default function ServiciosClient() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const toggle = (i: number) => setActiveIdx(prev => (prev === i ? null : i))

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <p className={styles.heroLabel}>Especialidades</p>
          <h1>Nuestros servicios</h1>
          <p className={styles.heroSub}>
            Trabajamos con tecnología actualizada, protocolos clínicos de alto nivel
            y un enfoque centrado en la experiencia, comodidad y confianza de cada paciente.
          </p>
        </section>

        <div className={styles.grid}>
          {SERVICIOS.map((s, i) => {
            const isOpen = activeIdx === i
            return (
              <div
                key={s.nombre}
                className={`${styles.card} ${isOpen ? styles.cardOpen : ''}`}
                onClick={() => toggle(i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i) } }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>{s.icon}</span>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>{s.nombre}</h2>
                    <p className={styles.cardDesc}>{s.descripcion}</p>
                  </div>
                  <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                <div className={`${styles.subList} ${isOpen ? styles.subListOpen : ''}`}>
                  <ul>
                    {s.subservicios.map(sub => (
                      <li key={sub}>{sub}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.cta}>
          <h2>¿Necesitas una valoración?</h2>
          <p>Agenda tu cita en línea y nuestros especialistas te orientarán.</p>
          <Link href="/citas" className="btn btn-primary">Agendar cita</Link>
        </div>
      </div>
    </div>
  )
}
