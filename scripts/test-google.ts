/**
 * Script de verificación de conectividad con Google Sheets y Calendar.
 *
 * Corre con:
 *   npx tsx scripts/test-google.ts
 *
 * Requiere que GOOGLE_SERVICE_ACCOUNT_FILE, GOOGLE_SHEETS_ID y
 * GOOGLE_CALENDAR_ID estén en .env.local (o exportados en el shell).
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('✓ Cargado .env.local\n')
} else {
  console.warn('⚠ No se encontró .env.local — usando variables de entorno del shell\n')
}

import { google } from 'googleapis'

// ─── Auth ────────────────────────────────────────────────────────────────────

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_FILE
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_FILE no está configurado')
  const credentials = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/calendar',
    ],
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function testSheets() {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) { console.error('✗ [Sheets] GOOGLE_SHEETS_ID no configurado'); return false }

  console.log(`📊 Verificando Google Sheets (ID: ${sheetsId})...`)
  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    // Leer las primeras 5 filas de la hoja citas
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range: 'citas!A1:O5',
    })

    const rows = res.data.values ?? []
    console.log(`  → Filas encontradas (máx 5): ${rows.length}`)
    if (rows.length > 0) {
      console.log('  → Primera fila (cabecera o datos):')
      console.log('   ', rows[0].join(' | '))
    } else {
      console.log('  → Hoja vacía (sin cabeceras aún)')
    }
    console.log('✓ [Sheets] Conectado correctamente\n')
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`✗ [Sheets] Error: ${msg}\n`)
    return false
  }
}

async function testCalendar() {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) { console.error('✗ [Calendar] GOOGLE_CALENDAR_ID no configurado'); return false }

  console.log(`📅 Verificando Google Calendar (ID: ${calendarId})...`)
  try {
    const auth     = getAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    // Obtener los próximos 5 eventos
    const now = new Date().toISOString()
    const res = await calendar.events.list({
      calendarId,
      timeMin: now,
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = res.data.items ?? []
    console.log(`  → Próximos eventos: ${events.length}`)
    for (const ev of events) {
      const start = ev.start?.dateTime ?? ev.start?.date ?? '?'
      console.log(`    • ${ev.summary ?? '(sin título)'} — ${start}`)
    }
    if (events.length === 0) {
      console.log('  → No hay eventos próximos en el calendario')
    }
    console.log('✓ [Calendar] Conectado correctamente\n')
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`✗ [Calendar] Error: ${msg}\n`)
    return false
  }
}

async function testSheetsWrite() {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) return false

  console.log('📝 Escribiendo fila de prueba en Sheets...')
  try {
    const auth   = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    const testRow = [
      'TEST_' + Date.now(),
      'cli_test',
      '573000000000',
      'Test Automatizado',
      'srv_test',
      'Servicio de Prueba',
      '0',
      new Date().toLocaleDateString('es-CO'),
      '08:00',
      '09:00',
      'TEST',
      '',
      new Date().toISOString(),
      new Date().toISOString(),
      'Fila de prueba — eliminar',
    ]

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: 'citas!A:O',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [testRow] },
    })

    const range = res.data.updates?.updatedRange ?? '?'
    console.log(`  → Fila escrita en rango: ${range}`)
    console.log('✓ [Sheets] Escritura correcta — recuerda borrar la fila de prueba\n')
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`✗ [Sheets] Error al escribir: ${msg}\n`)
    return false
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('  Test de conectividad Google APIs')
  console.log('═══════════════════════════════════════\n')

  const sheetsOk   = await testSheets()
  const calendarOk = await testCalendar()

  if (sheetsOk) {
    await testSheetsWrite()
  }

  console.log('═══════════════════════════════════════')
  console.log(`  Sheets:   ${sheetsOk   ? '✓ OK' : '✗ FALLO'}`)
  console.log(`  Calendar: ${calendarOk ? '✓ OK' : '✗ FALLO'}`)
  console.log('═══════════════════════════════════════')
  process.exit(sheetsOk && calendarOk ? 0 : 1)
}

main().catch(err => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
