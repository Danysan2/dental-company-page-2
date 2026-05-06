const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Staff
  const hashedPassword = await bcrypt.hash('Olinky2026!', 12)

  await prisma.staff.upsert({
    where: { email: 'doctora@olinky.com' },
    update: {},
    create: {
      email: 'doctora@olinky.com',
      nombre: 'Dra. Principal',
      password: hashedPassword,
      rol: 'doctora',
    },
  })

  await prisma.staff.upsert({
    where: { email: 'recepcion@olinky.com' },
    update: {},
    create: {
      email: 'recepcion@olinky.com',
      nombre: 'Recepcionista',
      password: hashedPassword,
      rol: 'recepcionista',
    },
  })

  console.log('Staff seeded.')

  // Servicios
  const servicios = [
    { nombre: 'Consulta General',        precio: 80000,  duracion: 30,  descripcion: 'Revisión odontológica general' },
    { nombre: 'Limpieza Dental',          precio: 120000, duracion: 60,  descripcion: 'Profilaxis y limpieza profesional' },
    { nombre: 'Blanqueamiento Dental',    precio: 350000, duracion: 90,  descripcion: 'Blanqueamiento dental profesional' },
    { nombre: 'Ortodoncia - Consulta',    precio: 80000,  duracion: 30,  descripcion: 'Consulta de valoración ortodoncia' },
    { nombre: 'Extracción Simple',        precio: 150000, duracion: 45,  descripcion: 'Extracción dental simple' },
    { nombre: 'Extracción Molar Juicio',  precio: 350000, duracion: 90,  descripcion: 'Extracción molar del juicio' },
    { nombre: 'Resina (obturación)',      precio: 180000, duracion: 60,  descripcion: 'Restauración con resina compuesta' },
    { nombre: 'Endodoncia',               precio: 450000, duracion: 120, descripcion: 'Tratamiento de conducto' },
    { nombre: 'Corona Dental',            precio: 800000, duracion: 60,  descripcion: 'Corona cerámica o zirconio' },
    { nombre: 'Implante Dental',          precio: 2500000,duracion: 120, descripcion: 'Implante de titanio + corona' },
  ]

  for (const s of servicios) {
    await prisma.servicio.upsert({
      where: { nombre: s.nombre },
      update: {},
      create: s,
    })
  }

  console.log('Servicios seeded.')

  // Sample clientes
  const cliente1 = await prisma.cliente.upsert({
    where: { cedula: '1234567890' },
    update: {},
    create: {
      nombre: 'María García',
      cedula: '1234567890',
      telefono: '3001234567',
      correo: 'maria.garcia@email.com',
    },
  })

  const cliente2 = await prisma.cliente.upsert({
    where: { cedula: '0987654321' },
    update: {},
    create: {
      nombre: 'Carlos López',
      cedula: '0987654321',
      telefono: '3109876543',
      correo: 'carlos.lopez@email.com',
    },
  })

  console.log('Clientes seeded.')

  // Sample citas
  const servicioConsulta = await prisma.servicio.findFirst({
    where: { nombre: 'Consulta General' },
  })
  const servicioLimpieza = await prisma.servicio.findFirst({
    where: { nombre: 'Limpieza Dental' },
  })

  if (servicioConsulta && servicioLimpieza) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 2)

    await prisma.cita.createMany({
      data: [
        {
          clienteId:  cliente1.id,
          servicioId: servicioConsulta.id,
          fecha:      tomorrow,
          hora:       '09:00',
          estado:     'programada',
          precio:     servicioConsulta.precio,
        },
        {
          clienteId:  cliente2.id,
          servicioId: servicioLimpieza.id,
          fecha:      dayAfter,
          hora:       '10:00',
          estado:     'programada',
          precio:     servicioLimpieza.precio,
        },
      ],
      skipDuplicates: true,
    })

    console.log('Citas seeded.')
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
