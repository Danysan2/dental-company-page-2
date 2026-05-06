import { NextResponse } from 'next/server'

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export const Unauthorized  = () => apiError('No autorizado', 401)
export const Forbidden     = () => apiError('Sin permisos', 403)
export const NotFound      = (msg = 'No encontrado') => apiError(msg, 404)
export const ServerError   = (msg = 'Error interno del servidor') => apiError(msg, 500)
export const BadRequest    = (msg: string) => apiError(msg, 400)
