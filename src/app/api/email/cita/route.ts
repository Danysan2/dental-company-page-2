import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const serviceId    = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateP    = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_PACIENTE
    const templateC    = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CLINICA
    const publicKey    = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    const accessToken  = process.env.EMAILJS_PRIVATE_KEY
    const emailClinica = process.env.NEXT_PUBLIC_CLINICA_EMAIL

    if (!serviceId || !publicKey || !accessToken || !templateP) {
      console.error('[email/cita] Configuración incompleta')
      return NextResponse.json({ ok: false, msg: 'Configuración de email incompleta' }, { status: 400 })
    }

    // Los templates esperan estas variables exactas
    const templateParams = {
      paciente_nombre: data.nombrePaciente ?? '',
      servicio:        data.servicio       ?? '',
      fecha:           data.fecha          ?? '',
      hora:            data.hora           ?? '',
      precio:          data.precio         ?? 'Consultar',
      paciente_correo: data.correo         ?? '',
    }

    const sends: Promise<Response>[] = []

    // Notificación al paciente (si tiene correo)
    if (data.correo && templateP) {
      console.log('[email/cita] Enviando email al paciente:', data.correo)

      sends.push(
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id:      serviceId,
            template_id:     templateP,
            user_id:         publicKey,
            accessToken:     accessToken,
            template_params: {
              ...templateParams,
              to_email: data.correo,
            },
          }),
        })
        .then(async (res) => {
          const text = await res.text()
          console.log('[email/cita] Paciente:', res.status, text)
          return res
        })
        .catch((e) => {
          console.error('[email/cita] Error paciente:', e)
          throw e
        })
      )
    }

    // Notificación interna a la clínica
    if (templateC && emailClinica) {
      console.log('[email/cita] Enviando email a la clínica:', emailClinica)

      sends.push(
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id:      serviceId,
            template_id:     templateC,
            user_id:         publicKey,
            accessToken:     accessToken,
            template_params: {
              ...templateParams,
              to_email: emailClinica,
            },
          }),
        })
        .then(async (res) => {
          const text = await res.text()
          console.log('[email/cita] Clínica:', res.status, text)
          return res
        })
        .catch((e) => {
          console.error('[email/cita] Error clínica:', e)
          throw e
        })
      )
    }

    await Promise.allSettled(sends)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/email/cita]:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
