export function validarNombre(nombre: string): string | null {
  if (!nombre?.trim()) return 'El nombre es requerido'
  if (nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
  if (nombre.trim().length > 100) return 'El nombre no puede superar 100 caracteres'
  if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/i.test(nombre.trim())) return 'El nombre solo puede contener letras'
  return null
}

export function validarCedula(cedula: string): string | null {
  if (!cedula?.trim()) return null // opcional
  if (!/^\d{6,12}$/.test(cedula.trim())) return 'La cédula debe tener entre 6 y 12 dígitos'
  return null
}

export function validarTelefono(telefono: string): string | null {
  if (!telefono?.trim()) return null // opcional
  if (!/^[0-9+\-\s()]{7,15}$/.test(telefono.trim())) return 'Teléfono inválido'
  return null
}

export function validarCorreo(correo: string): string | null {
  if (!correo?.trim()) return null // opcional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return 'Correo inválido'
  return null
}

export function validarFecha(fecha: string): string | null {
  if (!fecha) return 'La fecha es requerida'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'Formato de fecha inválido (YYYY-MM-DD)'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return 'Fecha inválida'
  return null
}

export function validarHora(hora: string): string | null {
  if (!hora) return 'La hora es requerida'
  if (!/^\d{2}:\d{2}$/.test(hora)) return 'Formato de hora inválido (HH:MM)'
  return null
}

export function sanitizarTexto(texto: string): string {
  return texto?.trim().replace(/\s+/g, ' ') ?? ''
}
