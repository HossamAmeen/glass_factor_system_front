import { apiFetch } from './client'

export interface Client {
  id: number
  name: string
  phone: string
  email: string
  address: string
  note: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface ClientPayload {
  name: string
  phone: string
  email?: string
  address?: string
  note?: string
}

export interface PaginatedClients {
  count: number
  next: string | null
  previous: string | null
  results: Client[]
}

export function listClients(params: { search?: string; limit?: number; offset?: number } = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  query.set('limit', String(params.limit ?? 100))
  query.set('offset', String(params.offset ?? 0))
  const qs = query.toString()
  return apiFetch<PaginatedClients>(`/api/v1/clients/?${qs}`)
}

export function createClient(payload: ClientPayload) {
  return apiFetch<Client>('/api/v1/clients/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateClient(id: number, payload: ClientPayload) {
  return apiFetch<Client>(`/api/v1/clients/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteClient(id: number) {
  return apiFetch<void>(`/api/v1/clients/${id}/`, {
    method: 'DELETE',
  })
}
