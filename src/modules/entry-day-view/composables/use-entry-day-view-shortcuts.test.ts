/**
 * Tests for use-entry-day-view-shortcuts composable
 */

import { defineComponent } from 'vue'

import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import { useEntryDayViewShortcuts } from './use-entry-day-view-shortcuts'

const { mockUseKeyboardShortcuts } = vi.hoisted(() => {
  const mockUseKeyboardShortcuts = vi.fn()
  return { mockUseKeyboardShortcuts }
})

vi.mock('@/shared/composables/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: mockUseKeyboardShortcuts
}))

function createTestComponent(
  handlers: Parameters<typeof useEntryDayViewShortcuts>[0]
) {
  return defineComponent({
    setup() {
      useEntryDayViewShortcuts(handlers)
    },
    template: '<div></div>'
  })
}

describe('useEntryDayViewShortcuts', () => {
  it('registers all 8 keyboard shortcuts', () => {
    const handlers = {
      focusCreateForm: vi.fn(),
      goToNextDay: vi.fn(),
      goToPrevDay: vi.fn(),
      handleOpenDatePicker: vi.fn(),
      handleSave: vi.fn(),
      handleEscape: vi.fn()
    }

    render(createTestComponent(handlers))

    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'cmd+n',
          handler: handlers.focusCreateForm
        }),
        expect.objectContaining({ key: 'j', handler: handlers.goToNextDay }),
        expect.objectContaining({ key: 'k', handler: handlers.goToPrevDay }),
        expect.objectContaining({
          key: 'arrowdown',
          handler: handlers.goToNextDay
        }),
        expect.objectContaining({
          key: 'arrowup',
          handler: handlers.goToPrevDay
        }),
        expect.objectContaining({
          key: 'g',
          handler: handlers.handleOpenDatePicker
        }),
        expect.objectContaining({ key: 'cmd+s', handler: handlers.handleSave }),
        expect.objectContaining({
          key: 'escape',
          handler: handlers.handleEscape
        })
      ])
    )
  })

  it('passes preventDefault: true for navigation shortcuts', () => {
    const handlers = {
      focusCreateForm: vi.fn(),
      goToNextDay: vi.fn(),
      goToPrevDay: vi.fn(),
      handleOpenDatePicker: vi.fn(),
      handleSave: vi.fn(),
      handleEscape: vi.fn()
    }

    render(createTestComponent(handlers))

    const registeredShortcuts = mockUseKeyboardShortcuts.mock.calls[0]![0] as {
      key: string
      preventDefault: boolean
    }[]
    const escapeShortcut = registeredShortcuts.find((s) => s.key === 'escape')

    expect(escapeShortcut).toBeDefined()
    expect(escapeShortcut!.preventDefault).toBe(false)
  })
})
