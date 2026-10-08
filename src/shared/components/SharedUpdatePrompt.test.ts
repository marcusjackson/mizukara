/**
 * Tests for SharedUpdatePrompt component
 */

import { ref } from 'vue'

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SharedUpdatePrompt from './SharedUpdatePrompt.vue'

vi.mock('@/shared/composables/use-pwa-update', () => ({
  usePwaUpdate: vi.fn()
}))

describe('SharedUpdatePrompt', () => {
  const mockReload = vi.fn()
  const mockNeedRefresh = ref(false)

  beforeEach(async () => {
    mockNeedRefresh.value = false

    const { usePwaUpdate } = vi.mocked(
      await import('@/shared/composables/use-pwa-update')
    )
    usePwaUpdate.mockReturnValue({
      needRefresh: mockNeedRefresh,
      reload: mockReload
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no update is available', () => {
    render(SharedUpdatePrompt)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders the prompt when an update is available', () => {
    mockNeedRefresh.value = true
    render(SharedUpdatePrompt)

    expect(screen.getByRole('status')).toHaveTextContent(
      'A new version is available.'
    )
  })

  it('calls reload when the button is clicked', async () => {
    mockNeedRefresh.value = true
    render(SharedUpdatePrompt)

    await userEvent.click(
      screen.getByRole('button', { name: 'Reload to update' })
    )

    expect(mockReload).toHaveBeenCalledOnce()
  })
})
