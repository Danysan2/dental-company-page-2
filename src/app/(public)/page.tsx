import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: 'Dental Company — Mejor Clínica Odontológica en Arauca | Dra. Cindy Ortiz',
  description: 'Clínica odontológica líder en Arauca. Rehabilitación Oral, Estética Dental, Ortodoncia, Endodoncia y más. Dra. Cindy Ortiz, especialista con más de 10 años de experiencia. ¡Agenda tu cita hoy!',
  keywords: [
    'clínica odontológica Arauca',
    'odontólogo Arauca',
    'dentista Arauca',
    'mejor clínica dental Arauca',
    'Dra. Cindy Ortiz',
    'rehabilitación oral Arauca',
    'estética dental Arauca',
    'ortodoncia Arauca',
    'endodoncia Arauca',
    'periodoncia Arauca',
    'diseño de sonrisa Arauca',
    'blanqueamiento dental Arauca',
    'clínica dental departamento Arauca',
    'salud oral Arauca',
    'Dental Company Arauca',
    'citas odontológicas Arauca',
  ],
  openGraph: {
    title: 'Dental Company — Clínica Odontológica en Arauca',
    description: 'La mejor clínica dental en Arauca. Especialistas en Rehabilitación Oral y Estética Dental. Dra. Cindy Ortiz. Agenda en línea.',
    url: 'https://www.dentalcompany.com.co',
    siteName: 'Dental Company',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: '/og-home.png', width: 1200, height: 630, alt: 'Dental Company — Clínica Odontológica Arauca' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dental Company — Clínica Odontológica en Arauca',
    description: 'Especialistas en Rehabilitación Oral y Estética Dental en Arauca. Agenda tu cita en línea.',
    images: ['/og-home.png'],
  },
  alternates: {
    canonical: 'https://www.dentalcompany.com.co',
  },
}

export default function HomePage() {
  return <HomeClient />
}
