import type { Metadata } from 'next'
import AdminCitas from '@/components/admin/AdminCitas'

export const metadata: Metadata = { title: 'Citas' }

export default function CitasPage() {
  return <AdminCitas />
}
