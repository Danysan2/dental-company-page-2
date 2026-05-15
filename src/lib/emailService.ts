interface CitaEmailData {
  nombrePaciente: string
  correo?: string | null
  telefono?: string | null
  servicio: string
  fecha: string
  hora: string
  estado?: string
}

const N8N_WEBHOOK = 'https://n8n-n8n.dtbfmw.easypanel.host/webhook-test/8b95d35b-4948-4a42-b93a-f59a0410595f'

/**
 * Envía datos de la cita al webhook de n8n para que dispare
 * el flujo de correo de confirmación.
 */
export async function enviarCorreosCita(data: CitaEmailData): Promise<void> {
  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paciente_nombre: data.nombrePaciente,
        paciente_correo: data.correo ?? '',
        paciente_telefono: data.telefono ?? '',
        servicio: data.servicio,
        fecha: data.fecha,
        hora: data.hora,
        estado: data.estado ?? 'programada',
      }),
    })
    if (!res.ok) {
      console.warn('[emailService] n8n webhook respondió:', res.status)
    }
  } catch (e) {
    console.warn('[emailService] Error enviando al webhook:', e)
  }
}
