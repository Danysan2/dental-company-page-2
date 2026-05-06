'use client'

type FetchOptions = RequestInit & { json?: unknown }

async function apiFetch<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { json, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body: json !== undefined ? JSON.stringify(json) : init.body,
    credentials: 'same-origin',
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = (data as { error?: string }).error ?? `Error ${res.status}`
    throw new Error(msg)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(url: string, init?: RequestInit) =>
    apiFetch<T>(url, init),
  post:   <T>(url: string, body: unknown, init?: RequestInit) =>
    apiFetch<T>(url, { method: 'POST', json: body, ...init }),
  put:    <T>(url: string, body: unknown, init?: RequestInit) =>
    apiFetch<T>(url, { method: 'PUT',  json: body, ...init }),
  patch:  <T>(url: string, body: unknown, init?: RequestInit) =>
    apiFetch<T>(url, { method: 'PATCH', json: body, ...init }),
  delete: <T>(url: string, init?: RequestInit) =>
    apiFetch<T>(url, { method: 'DELETE', ...init }),
}
