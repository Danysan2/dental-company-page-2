import type { Metadata } from 'next'
import AdminClientes from '@/components/admin/AdminClientes'

export const metadata: Metadata = { title: 'Clientes' }

export default function ClientesPage() {
  return <AdminClientes />
}
