import type { Metadata } from 'next'
import ServiciosClient from './ServiciosClient'

export const metadata: Metadata = {
  title:       'Servicios | Dental Company',
  description: 'Conoce todos los servicios odontológicos que ofrecemos: rehabilitación oral, estética dental, ortodoncia, endodoncia, periodoncia y odontología general.',
}

export default function ServiciosPage() {
  return <ServiciosClient />
}
