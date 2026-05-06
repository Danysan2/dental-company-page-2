import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './Nosotros.module.css'

export const metadata: Metadata = {
  title:       'Nosotros | Dental Company',
  description: 'Conoce al equipo de Dental Company y nuestra misión de cuidar tu salud bucal.',
}

export default function NosotrosPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <h1>Sobre Dental Company</h1>
          <p>Más de 10 años cuidando la salud bucal de nuestra comunidad con pasión y dedicación.</p>
        </section>

        <section className={styles.mision}>
          <div className="card">
            <h2>🎯 Nuestra misión</h2>
            <p>Brindar atención odontológica de excelencia, accesible y humana, mejorando la calidad de vida de cada paciente a través de su salud bucal.</p>
          </div>
          <div className="card">
            <h2>👁️ Visión</h2>
            <p>Ser la clínica odontológica de referencia en la región, reconocida por la calidad técnica, el trato humano y los resultados que transforman sonrisas.</p>
          </div>
          <div className="card">
            <h2>💎 Valores</h2>
            <ul>
              <li>Excelencia clínica</li>
              <li>Compromiso con el paciente</li>
              <li>Ética profesional</li>
              <li>Innovación constante</li>
            </ul>
          </div>
        </section>

        <div className={styles.cta}>
          <h2>¿Listo para conocernos?</h2>
          <Link href="/citas" className="btn btn-primary">Agenda tu primera cita</Link>
        </div>
      </div>
    </div>
  )
}
