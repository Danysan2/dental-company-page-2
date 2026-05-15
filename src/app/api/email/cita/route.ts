import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK = 'https://n8n-n8n.dtbfmw.easypanel.host/webhook-test/8b95d35b-4948-4a42-b93a-f59a0410595f'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const res = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paciente_nombre:   data.nombrePaciente ?? '',
        paciente_correo:   data.correo         ?? '',
        paciente_telefono: data.telefono        ?? '',
        servicio:          data.servicio        ?? '',
        fecha:             data.fecha           ?? '',
        hora:              data.hora            ?? '',
        estado:            data.estado          ?? 'programada',
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[email/cita] n8n webhook respondió:', res.status, text)
      return NextResponse.json({ ok: false, msg: `Webhook error: ${res.status}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/email/cita]:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
