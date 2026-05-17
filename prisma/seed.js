const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Staff ────────────────────────────────────────────────────
  const hashedDoctora   = await bcrypt.hash('Cindy2026!', 12)
  const hashedRecepcion = await bcrypt.hash('Reception2026!', 12)

  await prisma.staff.upsert({
    where:  { email: 'doctora@dentalcompany.com' },
    update: {},
    create: { email: 'doctora@dentalcompany.com', nombre: 'Dra. Cindy Ortiz', password: hashedDoctora, rol: 'doctora' },
  })

  await prisma.staff.upsert({
    where:  { email: 'recepcion@dentalcompany.com' },
    update: {},
    create: { email: 'recepcion@dentalcompany.com', nombre: 'Recepción', password: hashedRecepcion, rol: 'recepcionista' },
  })

  console.log('✓ Staff')

  // ── Servicios (categorías generales) ─────────────────────────
  const serviciosData = [
    {
      nombre:      'Rehabilitación Oral y Estética Dental',
      descripcion: 'Restauramos y diseñamos sonrisas con materiales de última generación, logrando resultados naturales, armónicos y duraderos.',
      precio:      0,
      duracion:    60,
    },
    {
      nombre:      'Manejo de la Articulación Temporomandibular (ATM)',
      descripcion: 'Diagnóstico y tratamiento especializado del dolor orofacial y trastornos de la ATM.',
      precio:      0,
      duracion:    60,
    },
    {
      nombre:      'Endodoncia',
      descripcion: 'Tratamientos enfocados en la conservación dental y alivio del dolor.',
      precio:      0,
      duracion:    90,
    },
    {
      nombre:      'Periodoncia',
      descripcion: 'Salud y mantenimiento de los tejidos de soporte dental.',
      precio:      0,
      duracion:    60,
    },
    {
      nombre:      'Ortodoncia',
      descripcion: 'Soluciones modernas para la alineación dental y estética de la sonrisa.',
      precio:      0,
      duracion:    60,
    },
    {
      nombre:      'Odontología General',
      descripcion: 'Prevención y restauración con enfoque estético.',
      precio:      0,
      duracion:    45,
    },
  ]

  for (const s of serviciosData) {
    await prisma.servicio.upsert({ where: { nombre: s.nombre }, update: {}, create: s })
  }

  console.log('✓ Servicios')

  // ── SubServicios ─────────────────────────────────────────────
  const servicios = await prisma.servicio.findMany({ where: { activo: true } })
  const byName = (n) => servicios.find(s => s.nombre === n)

  const subServiciosData = [
    // Rehabilitación Oral y Estética Dental
    { nombre: 'Diseños de sonrisa en cerámica (carillas cerámicas y lentes cerámicos)', servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Diseños de sonrisa en resina de alta estética',                          servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Carillas directas e indirectas',                                         servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Incrustaciones (inlays/onlays)',                                         servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Coronas totalmente cerámicas y metal-cerámica',                          servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Prótesis fijas',                                                         servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Prótesis sobre implantes',                                               servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Prótesis totales',                                                       servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },
    { nombre: 'Prótesis removibles',                                                    servicioId: byName('Rehabilitación Oral y Estética Dental')?.id },

    // ATM
    { nombre: 'Trastornos de la ATM',                          servicioId: byName('Manejo de la Articulación Temporomandibular (ATM)')?.id },
    { nombre: 'Placas neuromiorelajantes de alta precisión',   servicioId: byName('Manejo de la Articulación Temporomandibular (ATM)')?.id },

    // Endodoncia
    { nombre: 'Endodoncia en dientes unirradiculares y multirradiculares', servicioId: byName('Endodoncia')?.id },
    { nombre: 'Retratamientos endodónticos',                               servicioId: byName('Endodoncia')?.id },
    { nombre: 'Manejo de infecciones pulpares',                            servicioId: byName('Endodoncia')?.id },

    // Periodoncia
    { nombre: 'Tratamiento de enfermedad periodontal (gingivitis y periodontitis)', servicioId: byName('Periodoncia')?.id },
    { nombre: 'Frenilectomías',                                                     servicioId: byName('Periodoncia')?.id },
    { nombre: 'Terapias de mantenimiento periodontal',                              servicioId: byName('Periodoncia')?.id },

    // Ortodoncia
    { nombre: 'Ortodoncia convencional',                      servicioId: byName('Ortodoncia')?.id },
    { nombre: 'Ortodoncia de autoligado',                     servicioId: byName('Ortodoncia')?.id },
    { nombre: 'Ortodoncia estética (brackets de zafiro)',     servicioId: byName('Ortodoncia')?.id },
    { nombre: 'Ortodoncia invisible (alineadores transparentes)', servicioId: byName('Ortodoncia')?.id },

    // Odontología General
    { nombre: 'Restauraciones en resina de alta estética',              servicioId: byName('Odontología General')?.id },
    { nombre: 'Reemplazo de amalgamas por materiales estéticos',        servicioId: byName('Odontología General')?.id },
    { nombre: 'Tratamientos preventivos y de mantenimiento',            servicioId: byName('Odontología General')?.id },
  ]

  for (const sub of subServiciosData) {
    if (!sub.servicioId) {
      console.warn(`  ⚠ No se encontró el servicio para: ${sub.nombre}`)
      continue
    }
    const existing = await prisma.subServicio.findFirst({
      where: { nombre: sub.nombre, servicioId: sub.servicioId },
    })
    if (!existing) {
      await prisma.subServicio.create({ data: sub })
    }
  }

  console.log('✓ SubServicios')
  console.log('\n✅ Seed completo!')
  console.log('   Doctora   — doctora@dentalcompany.com  / Cindy2026!')
  console.log('   Recepción — recepcion@dentalcompany.com / Reception2026!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
