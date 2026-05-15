interface CitaEmailData {
  nombrePaciente: string
  correo?: string | null
  telefono?: string | null
  servicio: string
  fecha: string
  hora: string
  estado?: string
}

/**
 * Envía datos de la cita al API route server-side,
 * que a su vez llama al webhook de n8n para disparar el correo.
 */
export async function enviarCorreosCita(data: CitaEmailData): Promise<void> {
  try {
    const res = await fetch('/api/email/cita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      console.warn('[emailService] Error:', res.status)
    }
  } catch (e) {
    console.warn('[emailService] Error enviando correo:', e)
  }
}
