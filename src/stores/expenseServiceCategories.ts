import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  createExpenseServiceCategory,
  deleteExpenseServiceCategory,
  listExpenseServiceCategories,
  updateExpenseServiceCategory,
  type ExpenseServiceCategory,
  type ExpenseServiceCategoryPayload,
} from '@/api/expenseServiceCategories'
import { ApiError } from '@/api/client'

export const useExpenseServiceCategoriesStore = defineStore('expenseServiceCategories', () => {
  const items = ref<ExpenseServiceCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const data = await listExpenseServiceCategories({ search: search.value || undefined })
      items.value = data.results
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load expense service categories'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(payload: ExpenseServiceCategoryPayload) {
    const category = await createExpenseServiceCategory(payload)
    items.value = [category, ...items.value.filter((c) => c.id !== category.id)]
    return category
  }

  async function update(id: number, payload: ExpenseServiceCategoryPayload) {
    const category = await updateExpenseServiceCategory(id, payload)
    items.value = items.value.map((c) => (c.id === id ? category : c))
    return category
  }

  async function remove(id: number) {
    await deleteExpenseServiceCategory(id)
    items.value = items.value.filter((c) => c.id !== id)
  }

  return { items, loading, error, search, fetchAll, create, update, remove }
})
