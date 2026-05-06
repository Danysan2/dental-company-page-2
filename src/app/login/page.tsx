import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title:  'Acceso Staff | Dental Company',
  robots: { index: false },
}

export default function LoginPage() {
  return <LoginClient />
}
