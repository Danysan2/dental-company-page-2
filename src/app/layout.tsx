import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  'Dental Company — Clínica Odontológica',
    template: '%s | Dental Company',
  },
  description: 'Clínica odontológica con los mejores especialistas. Agenda tu cita hoy.',
  metadataBase: new URL('https://www.dentalcompany.com.co'),
  icons: {
    icon: '/logo-png.png',
    apple: '/logo-png.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
