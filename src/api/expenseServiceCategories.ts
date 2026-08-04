import { apiFetch } from './client'

export interface ExpenseServiceCategory {
  id: number
  name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface ExpenseServiceCategoryPayload {
  name: string
}

export interface PaginatedExpenseServiceCategories {
  count: number
  next: string | null
  previous: string | null
  results: ExpenseServiceCategory[]
}

export function listExpenseServiceCategories(
  params: {
    search?: string
    limit?: number
    offset?: number
  } = {},
) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  query.set('limit', String(params.limit ?? 100))
  query.set('offset', String(params.offset ?? 0))
  const qs = query.toString()
  return apiFetch<PaginatedExpenseServiceCategories>(`/api/v1/expenses/service-categories/?${qs}`)
}

export function createExpenseServiceCategory(payload: ExpenseServiceCategoryPayload) {
  return apiFetch<ExpenseServiceCategory>('/api/v1/expenses/service-categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateExpenseServiceCategory(id: number, payload: ExpenseServiceCategoryPayload) {
  return apiFetch<ExpenseServiceCategory>(`/api/v1/expenses/service-categories/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteExpenseServiceCategory(id: number) {
  return apiFetch<void>(`/api/v1/expenses/service-categories/${id}/`, {
    method: 'DELETE',
  })
}
