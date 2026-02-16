/**
 * Tests for BaseToast component
 *
 * Note: Reka UI Toast uses teleport/portal which has limitations in jsdom.
 * These tests verify the component's structure with stubs.
 * Full toast behavior is tested via E2E tests.
 */

import { ref } from 'vue'

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import BaseToast from './BaseToast.vue'

import type { Toast } from '@/shared/composables/use-toast'

// Mock the useToast composable
vi.mock('@/shared/composables/use-toast', () => ({
  useToast: vi.fn(),
  DEFAULT_TOAST_DURATION: 2000
}))

describe('BaseToast', () => {
  const mockRemoveToast = vi.fn()
  const mockToasts = ref<Toast[]>([])

  beforeEach(async () => {
    mockToasts.value = []

    // Import after module is mocked
    const { useToast } = vi.mocked(
      await import('@/shared/composables/use-toast')
    )
    useToast.mockReturnValue({
      addToast: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      removeToast: mockRemoveToast,
      success: vi.fn(),
      toasts: mockToasts,
      warning: vi.fn()
    } as unknown as ReturnType<typeof useToast>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function mountToast(toasts: Toast[] = []) {
    mockToasts.value = toasts
    return mount(BaseToast, {
      global: {
        stubs: {
          ToastProvider: { template: '<div><slot /></div>' },
          ToastRoot: {
            props: ['class'],
            template:
              '<div :class="$props.class" data-testid="toast"><slot /></div>'
          },
          ToastTitle: { template: '<div class="title"><slot /></div>' },
          ToastDescription: {
            template: '<div class="description"><slot /></div>'
          },
          ToastClose: { template: '<button class="close"><slot /></button>' },
          ToastViewport: { template: '<div class="viewport"><slot /></div>' }
        }
      }
    })
  }

  it('renders toast viewport', () => {
    const wrapper = mountToast()
    expect(wrapper.find('.viewport').exists()).toBe(true)
  })

  it('renders success toast with correct class', () => {
    const wrapper = mountToast([
      {
        duration: 5000,
        id: '1',
        message: 'Success message',
        title: undefined,
        type: 'success'
      }
    ])

    const toast = wrapper.find('[data-testid="toast"]')
    expect(toast.exists()).toBe(true)
    expect(toast.classes()).toContain('base-toast-success')
  })

  it('renders error toast with correct class', () => {
    const wrapper = mountToast([
      {
        duration: 5000,
        id: '1',
        message: 'Error message',
        title: undefined,
        type: 'error'
      }
    ])

    const toast = wrapper.find('[data-testid="toast"]')
    expect(toast.classes()).toContain('base-toast-error')
  })

  it('renders toast message', () => {
    const wrapper = mountToast([
      {
        duration: 5000,
        id: '1',
        message: 'Test message',
        title: undefined,
        type: 'info'
      }
    ])

    expect(wrapper.find('.description').text()).toBe('Test message')
  })

  it('renders toast title when provided', () => {
    const wrapper = mountToast([
      {
        duration: 5000,
        id: '1',
        message: 'Message',
        title: 'Toast Title',
        type: 'info'
      }
    ])

    expect(wrapper.find('.title').text()).toBe('Toast Title')
  })

  it('renders multiple toasts', () => {
    const wrapper = mountToast([
      {
        duration: 5000,
        id: '1',
        message: 'First toast',
        title: undefined,
        type: 'success'
      },
      {
        duration: 5000,
        id: '2',
        message: 'Second toast',
        title: undefined,
        type: 'error'
      }
    ])

    const toasts = wrapper.findAll('[data-testid="toast"]')
    expect(toasts).toHaveLength(2)
  })

  it('renders close button', () => {
    const wrapper = mountToast([
      {
        duration: 5000,
        id: '1',
        message: 'Message',
        title: undefined,
        type: 'info'
      }
    ])

    expect(wrapper.find('.close').exists()).toBe(true)
  })
})
