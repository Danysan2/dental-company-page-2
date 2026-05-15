import type { Metadata } from 'next'
import CitasPublicClient from './CitasPublicClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Agendar Cita Online — Dental Company Arauca',
  description: 'Agenda tu cita odontológica en línea en Dental Company Arauca. Consulta general, ortodoncia, endodoncia, estética dental y más. Atención de lunes a sábado. ¡Reserva en minutos!',
  keywords: [
    'agendar cita odontológica Arauca',
    'cita dentista Arauca',
    'reservar cita dental Arauca',
    'consulta odontológica online Arauca',
    'Dental Company citas',
  ],
  openGraph: {
    title: 'Agendar Cita Online — Dental Company Arauca',
    description: 'Reserva tu cita odontológica en línea. Atención de lunes a sábado en Arauca.',
    url: 'https://www.dentalcompany.com.co/citas',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.dentalcompany.com.co/citas',
  },
}

export default function CitasPage() {
  return <CitasPublicClient />
}
