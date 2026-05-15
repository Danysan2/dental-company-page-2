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
 * Envía correos de confirmación de cita llamando al API route server-side.
 * Las credenciales de EmailJS NUNCA se exponen al cliente.
 */
export async function enviarCorreosCita(data: CitaEmailData): Promise<void> {
  try {
    await fetch('/api/email/cita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (e) {
    console.warn('[emailService] Error enviando correos:', e)
  }
}
