import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const BASE_URL = 'https://www.dentalcompany.com.co'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  'Dental Company — Mejor Clínica Odontológica en Arauca',
    template: '%s | Dental Company Arauca',
  },
  description: 'Clínica odontológica líder en Arauca, Colombia. Rehabilitación Oral, Estética Dental, Ortodoncia, Endodoncia, Periodoncia y Odontología General. Dra. Cindy Ortiz. Agenda tu cita en línea.',
  keywords: [
    'clínica odontológica Arauca',
    'dentista Arauca Colombia',
    'odontólogo Arauca',
    'mejor clínica dental Arauca',
    'Dra. Cindy Ortiz',
    'rehabilitación oral Arauca',
    'estética dental Arauca',
    'ortodoncia Arauca',
    'diseño de sonrisa Arauca',
    'Dental Company',
    'salud bucal Arauca',
    'departamento Arauca odontología',
  ],
  authors: [{ name: 'Dra. Cindy Ortiz', url: BASE_URL }],
  creator: 'Dental Company',
  publisher: 'Dental Company',
  openGraph: {
    title: 'Dental Company — Clínica Odontológica en Arauca',
    description: 'La mejor clínica dental en Arauca. Especialistas en Rehabilitación Oral y Estética Dental. Agenda en línea.',
    url: BASE_URL,
    siteName: 'Dental Company',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: '/og-home.png', width: 1200, height: 630, alt: 'Dental Company Arauca' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dental Company — Clínica Odontológica en Arauca',
    description: 'La mejor clínica dental en Arauca. Especialistas en Rehabilitación Oral y Estética Dental.',
    images: ['/og-home.png'],
  },
  icons: {
    icon: '/logo-png.png',
    apple: '/logo-png.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: BASE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dentist',
  name: 'Dental Company',
  description: 'Clínica odontológica especializada en Rehabilitación Oral y Estética Dental en Arauca, Colombia.',
  url: BASE_URL,
  telephone: '+573216252325',
  email: 'dentalcompany.calendar@gmail.com',
  image: `${BASE_URL}/logo-png.png`,
  priceRange: '$$',
  currenciesAccepted: 'COP',
  paymentAccepted: 'Cash, Credit Card',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Calle 19 #22-12 Barrio La Esperanza',
    addressLocality: 'Arauca',
    addressRegion: 'Arauca',
    postalCode: '810001',
    addressCountry: 'CO',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 7.083995127054471,
    longitude: -70.75922824785866,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: '08:00',
      closes: '12:00',
    },
  ],
  hasMap: 'https://www.google.com/maps?q=Calle+19+%2322-12+Barrio+La+Esperanza,+Arauca',
  sameAs: [
    'https://www.instagram.com/dentalcompany.co',
  ],
  medicalSpecialty: [
    'Rehabilitación Oral',
    'Estética Dental',
    'Ortodoncia',
    'Endodoncia',
    'Periodoncia',
    'Odontología General',
  ],
  employee: {
    '@type': 'Physician',
    name: 'Dra. Cindy Ortiz',
    jobTitle: 'Especialista en Rehabilitación Oral y Estética Dental',
  },
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="geo.region" content="CO-ARA" />
        <meta name="geo.placename" content="Arauca, Colombia" />
        <meta name="geo.position" content="7.083995127054471;-70.75922824785866" />
        <meta name="ICBM" content="7.083995127054471, -70.75922824785866" />
      </head>
      <body>
        {children}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
