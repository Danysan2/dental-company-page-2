import type { Metadata } from 'next'
import CitasPublicClient from './CitasPublicClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Agendar Cita | Dental Company',
  description: 'Agenda tu cita odontológica en línea. Selecciona servicio, fecha y hora.',
}

export default function CitasPage() {
  return <CitasPublicClient />
}
