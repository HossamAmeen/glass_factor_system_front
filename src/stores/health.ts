import { defineStore } from 'pinia'
import { ref } from 'vue'

import { fetchHealth, type HealthResponse } from '@/api/health'

export const useHealthStore = defineStore('health', () => {
  const data = ref<HealthResponse | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function check() {
    loading.value = true
    error.value = null

    try {
      data.value = await fetchHealth()
    } catch (err) {
      data.value = null
      error.value = err instanceof Error ? err.message : 'Health check failed'
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, check }
})
