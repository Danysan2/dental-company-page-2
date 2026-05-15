const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Staff ────────────────────────────────────────────────────
  const hashedDoctora    = await bcrypt.hash('Cindy2026!', 12)
  const hashedRecepcion  = await bcrypt.hash('Reception2026!', 12)

  await prisma.staff.upsert({
    where: { email: 'doctora@dentalcompany.com' },
    update: {},
    create: { email: 'doctora@dentalcompany.com', nombre: 'Dra. Cindy Ortiz', password: hashedDoctora, rol: 'doctora' },
  })

  await prisma.staff.upsert({
    where: { email: 'recepcion@dentalcompany.com' },
    update: {},
    create: { email: 'recepcion@dentalcompany.com', nombre: 'Recepción', password: hashedRecepcion, rol: 'recepcionista' },
  })

  console.log('✓ Staff')

  // ── Servicios ────────────────────────────────────────────────
  const serviciosData = [
    { nombre: 'Consulta General', precio: 80000, duracion: 30, descripcion: 'Revisión odontológica general' },
    { nombre: 'Limpieza Dental', precio: 120000, duracion: 60, descripcion: 'Profilaxis y limpieza profesional' },
    { nombre: 'Blanqueamiento Dental', precio: 350000, duracion: 90, descripcion: 'Blanqueamiento dental profesional' },
    { nombre: 'Ortodoncia - Consulta', precio: 80000, duracion: 30, descripcion: 'Consulta de valoración ortodoncia' },
    { nombre: 'Extracción Simple', precio: 150000, duracion: 45, descripcion: 'Extracción dental simple' },
    { nombre: 'Extracción Molar Juicio', precio: 350000, duracion: 90, descripcion: 'Extracción molar del juicio' },
    { nombre: 'Resina (obturación)', precio: 180000, duracion: 60, descripcion: 'Restauración con resina compuesta' },
    { nombre: 'Endodoncia', precio: 450000, duracion: 120, descripcion: 'Tratamiento de conducto' },
    { nombre: 'Corona Dental', precio: 800000, duracion: 60, descripcion: 'Corona cerámica o zirconio' },
    { nombre: 'Implante Dental', precio: 2500000, duracion: 120, descripcion: 'Implante de titanio + corona' },
  ]

  for (const s of serviciosData) {
    await prisma.servicio.upsert({ where: { nombre: s.nombre }, update: {}, create: s })
  }

  console.log('✓ Servicios')
  console.log('\n✅ Seed completo!')
  console.log('   Doctora  — doctora@dentalcompany.com  / Cindy2026!')
  console.log('   Recepción — recepcion@dentalcompany.com       / Reception2026!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
