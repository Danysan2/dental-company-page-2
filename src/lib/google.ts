/**
 * Google Sheets + Calendar integration
 *
 * Estructura de la hoja "citas" en Sheets (15 columnas):
 * A  id_cita
 * B  id_cliente
 * C  telefono
 * D  nombre
 * E  id_servicio
 * F  nombre_servicio
 * G  precio
 * H  fecha (DD/MM/YYYY)
 * I  hora_inicio (HH:MM)
 * J  hora_fin (HH:MM)
 * K  estado
 * L  calendar_event_id
 * M  fecha_creacion (ISO)
 * N  fecha_modificacion (ISO)
 * O  notas
 */

import { google } from 'googleapis'

// ─── Auth ────────────────────────────────────────────────────────────────────

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_FILE
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_FILE no está configurado')

  let credentials: object
  try {
    credentials = JSON.parse(raw)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_FILE no es un JSON válido')
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/calendar',
    ],
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formatea una fecha ISO "YYYY-MM-DD" a "DD/MM/YYYY" para Sheets */
function formatFechaSheets(fecha: string): string {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

/** Calcula hora_fin sumando duracionMinutos a hora_inicio "HH:MM" */
function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
  const [h, min] = horaInicio.split(':').map(Number)
  const totalMin = h * 60 + min + duracionMinutos
  const hFin = Math.floor(totalMin / 60) % 24
  const mFin = totalMin % 60
  return `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`
}

/** Color de Calendar según estado */
function colorPorEstado(estado: string): string {
  switch (estado) {
    case 'cancelada':    return '11' // rojo
    case 'completada':   return '2'  // verde (sage)
    case 'programada':   return '1'  // azul (lavender)
    default:             return '5'  // amarillo (banana)
  }
}

// ─── Sheets ──────────────────────────────────────────────────────────────────

export interface CitaGoogleData {
  id:             string
  clienteId:      string
  clienteTelefono: string
  clienteNombre:  string
  servicioId:     string
  servicioNombre: string
  precio:         number | null
  fecha:          string  // YYYY-MM-DD
  hora:           string  // HH:MM (hora_inicio)
  duracionMinutos: number
  estado:         string
  notas:          string | null
  createdAt:      Date
}

/**
 * Agrega una fila a la hoja "citas" en Sheets.
 * Devuelve el número de fila donde quedó (base 1, incluyendo cabecera),
 * o null si falló.
 */
export async function agregarCitaSheets(cita: CitaGoogleData): Promise<number | null> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) {
    console.warn('[Google Sheets] GOOGLE_SHEETS_ID no configurado — omitiendo sync')
    return null
  }

  try {
    const auth  = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    const horaFin = calcularHoraFin(cita.hora, cita.duracionMinutos)
    const now     = new Date().toISOString()

    const row = [
      cita.id,
      cita.clienteId,
      cita.clienteTelefono,
      cita.clienteNombre,
      cita.servicioId,
      cita.servicioNombre,
      cita.precio ?? '',
      formatFechaSheets(cita.fecha),
      cita.hora,
      horaFin,
      cita.estado,
      '',                         // L — calendar_event_id (se llena luego)
      cita.createdAt.toISOString(),
      now,
      cita.notas ?? '',
    ]

    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range:         'citas!A:O',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })

    // La respuesta indica el rango actualizado, ej: "citas!A5:O5"
    const updatedRange = appendRes.data.updates?.updatedRange ?? ''
    const match = updatedRange.match(/!A(\d+)/)
    return match ? parseInt(match[1], 10) : null
  } catch (err) {
    console.error('[Google Sheets] Error al agregar cita:', err)
    return null
  }
}

/**
 * Actualiza la columna L (calendar_event_id) de una fila ya existente en Sheets.
 */
export async function actualizarCalendarEventId(
  filaSheets: number,
  calendarEventId: string,
): Promise<void> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId || !calendarEventId) return

  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetsId,
      range:         `citas!L${filaSheets}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[calendarEventId]] },
    })
  } catch (err) {
    console.error('[Google Sheets] Error al actualizar calendar_event_id:', err)
  }
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

/**
 * Crea un evento en Google Calendar.
 * Devuelve el event ID o null si falló.
 */
export async function crearEventoCalendar(cita: CitaGoogleData): Promise<string | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) {
    console.warn('[Google Calendar] GOOGLE_CALENDAR_ID no configurado — omitiendo sync')
    return null
  }

  try {
    const auth     = getAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const horaFin  = calcularHoraFin(cita.hora, cita.duracionMinutos)
    const startDt  = `${cita.fecha}T${cita.hora}:00`
    const endDt    = `${cita.fecha}T${horaFin}:00`
    const tz       = 'America/Bogota'

    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary:     `${cita.servicioNombre} - ${cita.clienteNombre}`,
        description: [
          `Paciente: ${cita.clienteNombre}`,
          `Teléfono: ${cita.clienteTelefono}`,
          `Servicio: ${cita.servicioNombre}`,
          cita.precio != null ? `Precio: $${cita.precio.toLocaleString('es-CO')}` : '',
          `ID cita: ${cita.id}`,
          cita.notas ? `Notas: ${cita.notas}` : '',
        ].filter(Boolean).join('\n'),
        start:       { dateTime: startDt, timeZone: tz },
        end:         { dateTime: endDt,   timeZone: tz },
        colorId:     colorPorEstado(cita.estado),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
        extendedProperties: {
          private: {
            cita_id:          cita.id,
            cliente_telefono: cita.clienteTelefono,
            precio:           String(cita.precio ?? ''),
          },
        },
      },
    })

    return event.data.id ?? null
  } catch (err) {
    console.error('[Google Calendar] Error al crear evento:', err)
    return null
  }
}
