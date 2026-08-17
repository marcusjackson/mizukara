/**
 * Tests for usePwaUpdate composable
 */

import { ref } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNeedRefresh = ref(false)
const mockUpdateServiceWorker = vi.fn().mockResolvedValue(undefined)

vi.mock('virtual:pwa-register/vue', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: mockNeedRefresh,
    offlineReady: ref(false),
    updateServiceWorker: mockUpdateServiceWorker
  }))
}))

describe('usePwaUpdate', () => {
  beforeEach(() => {
    mockNeedRefresh.value = false
    mockUpdateServiceWorker.mockClear()
  })

  it('exposes needRefresh from the service worker registration', async () => {
    const { usePwaUpdate } = await import('./use-pwa-update')
    mockNeedRefresh.value = true

    const { needRefresh } = usePwaUpdate()

    expect(needRefresh.value).toBe(true)
  })

  it('reload() activates the waiting service worker and reloads', async () => {
    const { usePwaUpdate } = await import('./use-pwa-update')
    const { reload } = usePwaUpdate()

    await reload()

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
  })
})
