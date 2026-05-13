const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return d
}

async function main() {
  console.log('Seeding database...')

  // ── Staff ────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Olinky2026!', 12)

  await prisma.staff.upsert({
    where:  { email: 'doctora@olinky.com' },
    update: {},
    create: { email: 'doctora@olinky.com', nombre: 'Dra. Cindy Ortiz', password: hashedPassword, rol: 'doctora' },
  })

  await prisma.staff.upsert({
    where:  { email: 'recepcion@olinky.com' },
    update: {},
    create: { email: 'recepcion@olinky.com', nombre: 'Andrea Molina', password: hashedPassword, rol: 'recepcionista' },
  })

  console.log('✓ Staff')

  // ── Servicios ────────────────────────────────────────────────
  const serviciosData = [
    { nombre: 'Consulta General',       precio:   80000, duracion:  30, descripcion: 'Revisión odontológica general' },
    { nombre: 'Limpieza Dental',         precio:  120000, duracion:  60, descripcion: 'Profilaxis y limpieza profesional' },
    { nombre: 'Blanqueamiento Dental',   precio:  350000, duracion:  90, descripcion: 'Blanqueamiento dental profesional' },
    { nombre: 'Ortodoncia - Consulta',   precio:   80000, duracion:  30, descripcion: 'Consulta de valoración ortodoncia' },
    { nombre: 'Extracción Simple',       precio:  150000, duracion:  45, descripcion: 'Extracción dental simple' },
    { nombre: 'Extracción Molar Juicio', precio:  350000, duracion:  90, descripcion: 'Extracción molar del juicio' },
    { nombre: 'Resina (obturación)',     precio:  180000, duracion:  60, descripcion: 'Restauración con resina compuesta' },
    { nombre: 'Endodoncia',              precio:  450000, duracion: 120, descripcion: 'Tratamiento de conducto' },
    { nombre: 'Corona Dental',           precio:  800000, duracion:  60, descripcion: 'Corona cerámica o zirconio' },
    { nombre: 'Implante Dental',         precio: 2500000, duracion: 120, descripcion: 'Implante de titanio + corona' },
  ]

  for (const s of serviciosData) {
    await prisma.servicio.upsert({ where: { nombre: s.nombre }, update: {}, create: s })
  }

  const servicios = await prisma.servicio.findMany()
  const byNombre = Object.fromEntries(servicios.map(s => [s.nombre, s]))
  console.log('✓ Servicios')

  // ── Clientes ─────────────────────────────────────────────────
  const clientesData = [
    { nombre: 'María García',      cedula: '1001234567', telefono: '3001234567', correo: 'maria.garcia@gmail.com' },
    { nombre: 'Carlos López',      cedula: '1009876543', telefono: '3109876543', correo: 'carlos.lopez@gmail.com' },
    { nombre: 'Sofía Martínez',    cedula: '1012345678', telefono: '3152345678', correo: 'sofia.m@hotmail.com' },
    { nombre: 'Andrés Herrera',    cedula: '1023456789', telefono: '3003456789', correo: null },
    { nombre: 'Lucía Ramírez',     cedula: '1034567890', telefono: '3164567890', correo: 'lucia.r@gmail.com' },
    { nombre: 'Juan Morales',      cedula: '1045678901', telefono: '3015678901', correo: 'jmorales@outlook.com' },
    { nombre: 'Camila Torres',     cedula: '1056789012', telefono: '3126789012', correo: null },
    { nombre: 'Diego Vargas',      cedula: '1067890123', telefono: '3007890123', correo: 'dvargas@gmail.com' },
    { nombre: 'Valentina Cruz',    cedula: '1078901234', telefono: '3178901234', correo: 'vcruz@gmail.com' },
    { nombre: 'Felipe Jiménez',    cedula: '1089012345', telefono: '3009012345', correo: null },
    { nombre: 'Isabella Rojas',    cedula: '1090123456', telefono: '3150123456', correo: 'isabella.r@hotmail.com' },
    { nombre: 'Sebastián Díaz',    cedula: '1001234568', telefono: '3001234568', correo: 'sdiaz@gmail.com' },
    { nombre: 'Natalia Peña',      cedula: '1002345679', telefono: '3002345679', correo: null },
    { nombre: 'Mateo Castillo',    cedula: '1003456780', telefono: '3183456780', correo: 'mcastillo@gmail.com' },
    { nombre: 'Laura Mendoza',     cedula: '1004567891', telefono: '3004567891', correo: 'lmendoza@gmail.com' },
  ]

  const clientes = []
  for (const c of clientesData) {
    const cliente = await prisma.cliente.upsert({ where: { cedula: c.cedula }, update: {}, create: c })
    clientes.push(cliente)
  }
  console.log('✓ Clientes')

  // ── Citas ────────────────────────────────────────────────────
  // Distribuidas en los últimos 3 meses + próximas 2 semanas
  const horarios = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

  const citasData = [
    // Hace 3 meses (completadas)
    { diasOffset: -90, clienteIdx: 0,  servicioNombre: 'Consulta General',      hora: '08:00', estado: 'completada' },
    { diasOffset: -88, clienteIdx: 1,  servicioNombre: 'Limpieza Dental',        hora: '10:00', estado: 'completada' },
    { diasOffset: -85, clienteIdx: 2,  servicioNombre: 'Blanqueamiento Dental',  hora: '09:00', estado: 'completada' },
    { diasOffset: -82, clienteIdx: 3,  servicioNombre: 'Extracción Simple',      hora: '11:00', estado: 'completada' },
    { diasOffset: -80, clienteIdx: 4,  servicioNombre: 'Consulta General',       hora: '14:00', estado: 'cancelada'  },
    { diasOffset: -78, clienteIdx: 5,  servicioNombre: 'Resina (obturación)',    hora: '08:00', estado: 'completada' },
    { diasOffset: -75, clienteIdx: 6,  servicioNombre: 'Endodoncia',             hora: '15:00', estado: 'completada' },
    { diasOffset: -72, clienteIdx: 7,  servicioNombre: 'Limpieza Dental',        hora: '09:00', estado: 'completada' },
    { diasOffset: -70, clienteIdx: 8,  servicioNombre: 'Ortodoncia - Consulta',  hora: '11:00', estado: 'no_asistio' },
    { diasOffset: -68, clienteIdx: 9,  servicioNombre: 'Consulta General',       hora: '16:00', estado: 'completada' },

    // Hace 2 meses (completadas/canceladas)
    { diasOffset: -60, clienteIdx: 10, servicioNombre: 'Corona Dental',          hora: '08:00', estado: 'completada' },
    { diasOffset: -58, clienteIdx: 11, servicioNombre: 'Limpieza Dental',        hora: '10:00', estado: 'completada' },
    { diasOffset: -55, clienteIdx: 12, servicioNombre: 'Blanqueamiento Dental',  hora: '09:00', estado: 'completada' },
    { diasOffset: -52, clienteIdx: 0,  servicioNombre: 'Resina (obturación)',    hora: '14:00', estado: 'completada' },
    { diasOffset: -50, clienteIdx: 1,  servicioNombre: 'Extracción Molar Juicio',hora: '11:00', estado: 'completada' },
    { diasOffset: -48, clienteIdx: 2,  servicioNombre: 'Endodoncia',             hora: '08:00', estado: 'cancelada'  },
    { diasOffset: -45, clienteIdx: 3,  servicioNombre: 'Consulta General',       hora: '15:00', estado: 'completada' },
    { diasOffset: -42, clienteIdx: 4,  servicioNombre: 'Limpieza Dental',        hora: '09:00', estado: 'completada' },
    { diasOffset: -40, clienteIdx: 13, servicioNombre: 'Implante Dental',        hora: '08:00', estado: 'completada' },
    { diasOffset: -38, clienteIdx: 14, servicioNombre: 'Ortodoncia - Consulta',  hora: '16:00', estado: 'completada' },

    // Hace 1 mes
    { diasOffset: -30, clienteIdx: 5,  servicioNombre: 'Blanqueamiento Dental',  hora: '10:00', estado: 'completada' },
    { diasOffset: -28, clienteIdx: 6,  servicioNombre: 'Limpieza Dental',        hora: '08:00', estado: 'completada' },
    { diasOffset: -25, clienteIdx: 7,  servicioNombre: 'Resina (obturación)',    hora: '11:00', estado: 'completada' },
    { diasOffset: -22, clienteIdx: 8,  servicioNombre: 'Corona Dental',          hora: '09:00', estado: 'cancelada'  },
    { diasOffset: -20, clienteIdx: 9,  servicioNombre: 'Consulta General',       hora: '14:00', estado: 'completada' },
    { diasOffset: -18, clienteIdx: 10, servicioNombre: 'Endodoncia',             hora: '08:00', estado: 'completada' },
    { diasOffset: -15, clienteIdx: 11, servicioNombre: 'Extracción Simple',      hora: '15:00', estado: 'completada' },
    { diasOffset: -12, clienteIdx: 12, servicioNombre: 'Limpieza Dental',        hora: '10:00', estado: 'no_asistio' },
    { diasOffset: -10, clienteIdx: 0,  servicioNombre: 'Ortodoncia - Consulta',  hora: '09:00', estado: 'completada' },
    { diasOffset:  -8, clienteIdx: 1,  servicioNombre: 'Blanqueamiento Dental',  hora: '11:00', estado: 'completada' },

    // Este mes (mezcla)
    { diasOffset:  -6, clienteIdx: 2,  servicioNombre: 'Consulta General',       hora: '08:00', estado: 'completada' },
    { diasOffset:  -5, clienteIdx: 3,  servicioNombre: 'Limpieza Dental',        hora: '10:00', estado: 'completada' },
    { diasOffset:  -4, clienteIdx: 4,  servicioNombre: 'Resina (obturación)',    hora: '09:00', estado: 'completada' },
    { diasOffset:  -3, clienteIdx: 5,  servicioNombre: 'Endodoncia',             hora: '14:00', estado: 'cancelada'  },
    { diasOffset:  -2, clienteIdx: 6,  servicioNombre: 'Corona Dental',          hora: '08:00', estado: 'completada' },
    { diasOffset:  -1, clienteIdx: 7,  servicioNombre: 'Blanqueamiento Dental',  hora: '11:00', estado: 'completada' },

    // Próximas (programadas)
    { diasOffset:   1, clienteIdx: 8,  servicioNombre: 'Limpieza Dental',        hora: '09:00', estado: 'programada' },
    { diasOffset:   1, clienteIdx: 9,  servicioNombre: 'Consulta General',       hora: '11:00', estado: 'programada' },
    { diasOffset:   2, clienteIdx: 10, servicioNombre: 'Extracción Simple',      hora: '08:00', estado: 'programada' },
    { diasOffset:   3, clienteIdx: 11, servicioNombre: 'Blanqueamiento Dental',  hora: '10:00', estado: 'programada' },
    { diasOffset:   5, clienteIdx: 12, servicioNombre: 'Resina (obturación)',    hora: '14:00', estado: 'programada' },
    { diasOffset:   7, clienteIdx: 13, servicioNombre: 'Endodoncia',             hora: '08:00', estado: 'programada' },
    { diasOffset:   8, clienteIdx: 14, servicioNombre: 'Implante Dental',        hora: '09:00', estado: 'programada' },
    { diasOffset:  10, clienteIdx: 0,  servicioNombre: 'Corona Dental',          hora: '11:00', estado: 'programada' },
  ]

  for (const c of citasData) {
    const cliente  = clientes[c.clienteIdx]
    const servicio = byNombre[c.servicioNombre]
    const fecha    = daysFromNow(c.diasOffset)

    // Evitar duplicados: misma fecha + hora + cliente
    const exists = await prisma.cita.findFirst({
      where: { clienteId: cliente.id, fecha, hora: c.hora },
    })
    if (exists) continue

    await prisma.cita.create({
      data: {
        clienteId:  cliente.id,
        servicioId: servicio.id,
        fecha,
        hora:    c.hora,
        estado:  c.estado,
        precio:  servicio.precio,
      },
    })
  }

  console.log('✓ Citas')
  console.log('\n✅ Seed completo!')
  console.log('   Email:    doctora@olinky.com')
  console.log('   Password: Olinky2026!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
