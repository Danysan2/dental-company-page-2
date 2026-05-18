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

/**
 * Normaliza un teléfono al formato internacional para Sheets ("CCXXXXXXXXXX", sin +).
 * - Número ya con código de país (>10 dígitos): se usa tal cual
 * - Número legacy de 10 dígitos colombiano (empieza con 3): se añade "57"
 * - Otros números cortos (< 10 dígitos): se dejan tal cual para no asumir país
 */
function normalizePhoneSheets(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return digits
  // Ya tiene código de país
  if (digits.length > 10) return digits
  // Número colombiano legacy de 10 dígitos sin código de país
  if (digits.length === 10) return '57' + digits
  return digits
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
  horaFin?:       string | null  // HH:MM (hora_fin manual)
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
      normalizePhoneSheets(cita.clienteTelefono),
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
    console.error('[Google Sheets] Error al agregar cita (cita.id:', cita.id + '):', err)
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
    console.error('[Google Sheets] Error al actualizar calendar_event_id (fila:', filaSheets, 'eventId:', calendarEventId + '):', err)
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

    // Usa horaFin manual si existe, sino calcula por duración del servicio
    const horaFin  = cita.horaFin ?? calcularHoraFin(cita.hora, cita.duracionMinutos)
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
    console.error('[Google Calendar] Error al crear evento (cita.id:', cita.id + '):', err)
    return null
  }
}

/**
 * Elimina un evento de Google Calendar por su event ID.
 */
export async function eliminarEventoCalendar(calendarEventId: string): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId || !calendarEventId) return

  try {
    const auth     = getAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({ calendarId, eventId: calendarEventId })
  } catch (err: unknown) {
    // 410 Gone = ya fue eliminado previamente — googleapis expone el status en .response?.status (GaxiosError)
    const status =
      (err as { response?: { status?: number } })?.response?.status ??
      (err as { status?: number })?.status
    if (status !== 410) {
      console.error('[Google Calendar] Error al eliminar evento (eventId:', calendarEventId + '):', err)
    }
  }
}

// ─── Sheets — búsqueda y actualización ───────────────────────────────────────

export interface FilaCitaSheets {
  fila:            number   // número de fila (base 1, incluye cabecera)
  calendarEventId: string   // columna L
}

/**
 * Busca la fila de una cita en Sheets por su ID (columna A).
 * Devuelve { fila, calendarEventId } o null si no se encuentra.
 */
export async function buscarFilaCitaSheets(citaId: string): Promise<FilaCitaSheets | null> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) return null

  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    // Leer columnas A y L de toda la hoja
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range:         'citas!A:L',
    })

    const rows = res.data.values ?? []
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === citaId) {
        return {
          fila:            i + 1,          // Sheets es base 1
          calendarEventId: rows[i][11] ?? '', // columna L (índice 11)
        }
      }
    }
    return null
  } catch (err) {
    console.error('[Google Sheets] Error al buscar cita (citaId:', citaId + '):', err)
    return null
  }
}

/**
 * Busca la fila de una cita en Sheets por teléfono + fecha + hora.
 * Útil para citas creadas por el chatbot (ID diferente al UUID de Postgres).
 * Devuelve { fila, calendarEventId } o null si no se encuentra.
 */
export async function buscarFilaCitaPorDatos(
  telefono: string,
  fecha: string,    // DD/MM/YYYY (formato Sheets)
  hora: string,     // HH:MM
): Promise<FilaCitaSheets | null> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) return null

  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range:         'citas!A:L',
    })

    const rows = res.data.values ?? []
    // Normalizar teléfono: últimos 10 dígitos
    const telSufijo = telefono.replace(/\D/g, '').slice(-10)

    for (let i = 0; i < rows.length; i++) {
      const rowTel   = (rows[i][2] ?? '').replace(/\D/g, '').slice(-10) // col C
      const rowFecha = rows[i][7] ?? ''  // col H (DD/MM/YYYY)
      const rowHora  = rows[i][8] ?? ''  // col I (HH:MM)
      const rowEstado = rows[i][10] ?? '' // col K

      if (rowTel === telSufijo &&
          rowFecha === fecha &&
          rowHora === hora &&
          rowEstado !== 'cancelada') {
        return {
          fila:            i + 1,
          calendarEventId: rows[i][11] ?? '',
        }
      }
    }
    return null
  } catch (err) {
    console.error('[Google Sheets] Error al buscar cita por datos:', err)
    return null
  }
}

export interface ActualizacionCitaSheets {
  fecha?:  string  // YYYY-MM-DD
  hora?:   string  // HH:MM
  estado?: string
  duracionMinutos?: number
  calendarEventId?: string
}

/**
 * Actualiza los campos relevantes de una fila existente en Sheets.
 * Usado para reagendamiento (H, I, J, N) y cancelación (K, N).
 */
export async function actualizarCitaSheets(
  fila: number,
  datos: ActualizacionCitaSheets,
): Promise<void> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) return

  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const now    = new Date().toISOString()

    const updates: { range: string; values: unknown[][] }[] = []

    if (datos.fecha) {
      updates.push({ range: `citas!H${fila}`, values: [[formatFechaSheets(datos.fecha)]] })
    }
    if (datos.hora) {
      updates.push({ range: `citas!I${fila}`, values: [[datos.hora]] })
      const duracion = datos.duracionMinutos ?? 60
      updates.push({ range: `citas!J${fila}`, values: [[calcularHoraFin(datos.hora, duracion)]] })
    }
    if (datos.estado) {
      updates.push({ range: `citas!K${fila}`, values: [[datos.estado]] })
    }
    if (datos.calendarEventId !== undefined) {
      updates.push({ range: `citas!L${fila}`, values: [[datos.calendarEventId]] })
    }
    // Siempre actualizar fecha_modificacion (col N)
    updates.push({ range: `citas!N${fila}`, values: [[now]] })

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetsId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    })
  } catch (err) {
    console.error('[Google Sheets] Error al actualizar cita (fila:', fila + '):', err)
  }
}
