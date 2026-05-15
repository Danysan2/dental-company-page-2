import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Dra. Cindy Ortiz | Dental Company Arauca',
  description: 'Conoce a la Dra. Cindy Ortiz, especialista en Rehabilitación Oral y Estética Dental en Arauca con más de 10 años de experiencia. Clínica Dental Company, Calle 19 #22-12 Barrio La Esperanza.',
  keywords: [
    'Dra. Cindy Ortiz odontóloga Arauca',
    'especialista rehabilitación oral Arauca',
    'estética dental Arauca',
    'clínica odontológica Arauca',
    'sobre Dental Company',
    'equipo dental Arauca',
    'dentista especialista Arauca',
    'diseño de sonrisa Arauca',
    'historia clínica dental Arauca',
  ],
  openGraph: {
    title: 'Sobre Nosotros — Dra. Cindy Ortiz | Dental Company',
    description: 'Más de 10 años transformando sonrisas en Arauca. Dra. Cindy Ortiz, especialista en Rehabilitación Oral y Estética Dental.',
    url: 'https://www.dentalcompany.com.co/sobre-nosotros',
    siteName: 'Dental Company',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: '/og-home.png', width: 1200, height: 630, alt: 'Dra. Cindy Ortiz — Dental Company Arauca' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dra. Cindy Ortiz — Dental Company Arauca',
    description: 'Especialista en Rehabilitación Oral y Estética Dental en Arauca.',
    images: ['/og-home.png'],
  },
  alternates: {
    canonical: 'https://www.dentalcompany.com.co/sobre-nosotros',
  },
}

export default function SobreNosotrosPage() {
  return <AboutClient />
}
