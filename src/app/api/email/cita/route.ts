import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const serviceId    = process.env.EMAILJS_SERVICE_ID    || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateP    = process.env.EMAILJS_TEMPLATE_PACIENTE || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_PACIENTE
    const templateC    = process.env.EMAILJS_TEMPLATE_CLINICA  || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CLINICA
    const publicKey    = process.env.EMAILJS_PUBLIC_KEY    || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    const emailClinica = process.env.EMAILJS_CLINICA_EMAIL || process.env.NEXT_PUBLIC_CLINICA_EMAIL

    if (!serviceId || !publicKey) {
      return NextResponse.json({ ok: true }) // No configurado, omitir silenciosamente
    }

    const params = {
      nombre_paciente: data.nombrePaciente ?? '',
      servicio:        data.servicio       ?? '',
      fecha:           data.fecha          ?? '',
      hora:            data.hora           ?? '',
      estado:          data.estado         ?? 'programada',
      correo_paciente: data.correo         ?? '',
      telefono:        data.telefono       ?? '',
      email_clinica:   emailClinica        ?? '',
    }

    const sends: Promise<unknown>[] = []

    // Notificación al paciente (si tiene correo)
    if (data.correo && templateP) {
      sends.push(
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id:      serviceId,
            template_id:     templateP,
            user_id:         publicKey,
            template_params: { ...params, to_email: data.correo },
          }),
        }).catch(e => console.warn('[email/cita] Email paciente falló:', e))
      )
    }

    // Notificación interna a la clínica
    if (templateC && emailClinica) {
      sends.push(
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id:      serviceId,
            template_id:     templateC,
            user_id:         publicKey,
            template_params: { ...params, to_email: emailClinica },
          }),
        }).catch(e => console.warn('[email/cita] Email clínica falló:', e))
      )
    }

    await Promise.all(sends)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/email/cita]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
