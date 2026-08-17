/**
 * Tests for SharedUpdatePrompt component
 */

import { ref } from 'vue'

import { mount } from '@vue/test-utils'
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
    const wrapper = mount(SharedUpdatePrompt)
    expect(wrapper.find('.shared-update-prompt').exists()).toBe(false)
  })

  it('renders the prompt when an update is available', () => {
    mockNeedRefresh.value = true
    const wrapper = mount(SharedUpdatePrompt)

    expect(wrapper.find('.shared-update-prompt').exists()).toBe(true)
    expect(wrapper.text()).toContain('A new version is available.')
  })

  it('calls reload when the button is clicked', async () => {
    mockNeedRefresh.value = true
    const wrapper = mount(SharedUpdatePrompt)

    await wrapper.find('button').trigger('click')

    expect(mockReload).toHaveBeenCalledOnce()
  })
})
