import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useAuthStore } from '../auth'

vi.mock('@/api/auth', () => ({
  login: vi.fn(async () => ({ access: 'access-token', refresh: 'refresh-token' })),
}))

vi.mock('@/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/api/client')>('@/api/client')
  return {
    ...actual,
    getAccessToken: vi.fn(() => null),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  }
})

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('logs in and marks authenticated', async () => {
    const store = useAuthStore()
    await store.login('admin', 'admin')
    expect(store.accessToken).toBe('access-token')
    expect(store.isAuthenticated).toBe(true)
  })
})
