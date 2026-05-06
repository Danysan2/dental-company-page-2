'use client'

import emailjs from '@emailjs/browser'

interface CitaEmailData {
  nombrePaciente: string
  correo?: string | null
  telefono?: string | null
  servicio: string
  fecha: string
  hora: string
  estado?: string
}

export async function enviarCorreosCita(data: CitaEmailData): Promise<void> {
  const serviceId  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const templateP  = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_PACIENTE
  const templateC  = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CLINICA
  const publicKey  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  const emailClinica = process.env.NEXT_PUBLIC_CLINICA_EMAIL

  if (!serviceId || !publicKey) return

  const params = {
    nombre_paciente: data.nombrePaciente,
    servicio:        data.servicio,
    fecha:           data.fecha,
    hora:            data.hora,
    estado:          data.estado ?? 'programada',
    correo_paciente: data.correo ?? '',
    telefono:        data.telefono ?? '',
    email_clinica:   emailClinica ?? '',
  }

  const sends: Promise<unknown>[] = []

  // Notificación al paciente (si tiene correo)
  if (data.correo && templateP) {
    sends.push(
      emailjs.send(serviceId, templateP, { ...params, to_email: data.correo }, publicKey)
        .catch((err) => console.warn('Email paciente falló:', err))
    )
  }

  // Notificación interna a la clínica
  if (templateC && emailClinica) {
    sends.push(
      emailjs.send(serviceId, templateC, { ...params, to_email: emailClinica }, publicKey)
        .catch((err) => console.warn('Email clínica falló:', err))
    )
  }

  await Promise.all(sends)
}
