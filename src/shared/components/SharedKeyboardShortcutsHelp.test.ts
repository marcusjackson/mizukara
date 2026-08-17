/**
 * SharedKeyboardShortcutsHelp Tests
 *
 * Tests for the keyboard shortcuts help dialog component.
 *
 * Requirements tested: 7.5 (display shortcuts reference), 7.6 (keyboard accessible)
 */

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import SharedKeyboardShortcutsHelp from './SharedKeyboardShortcutsHelp.vue'

// Stub useKeyboardShortcuts since it depends on onMounted lifecycle
vi.mock('@/shared/composables/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn()
}))

describe('SharedKeyboardShortcutsHelp', () => {
  const renderComponent = () => {
    // Disable pointer events check — Reka UI dialog overlay sets pointer-events: none
    // which jsdom reports incorrectly since it doesn't compute CSS
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    const result = render(SharedKeyboardShortcutsHelp)

    return { ...result, user }
  }

  describe('trigger button', () => {
    it('renders a trigger button with ? text', () => {
      renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      expect(trigger).toBeInTheDocument()
      expect(trigger.textContent.trim()).toBe('?')
    })

    it('has proper aria-label for accessibility', () => {
      renderComponent()

      const trigger = screen.getByLabelText(/keyboard shortcuts/i)
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('dialog content', () => {
    it('opens dialog when trigger is clicked', async () => {
      const { user } = renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      await user.click(trigger)

      // Dialog rendered via portal to body
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('displays dialog title', async () => {
      const { user } = renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
      })
    })

    it('displays all keyboard shortcuts', async () => {
      const { user } = renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Verify shortcut descriptions are present
      expect(screen.getByText('Create new entry')).toBeInTheDocument()
      expect(screen.getByText('Next day')).toBeInTheDocument()
      expect(screen.getByText('Previous day')).toBeInTheDocument()
      expect(screen.getByText('Save entry')).toBeInTheDocument()
      expect(screen.getByText('Cancel / Clear')).toBeInTheDocument()
      expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument()
    })

    it('displays modifier key combinations', async () => {
      const { user } = renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const dialog = screen.getByRole('dialog')
      const dialogText = dialog.textContent

      // Should contain modifier key (Cmd or Ctrl depending on platform)
      expect(dialogText).toMatch(/cmd|ctrl/i)
      // Should contain key characters
      expect(dialogText).toMatch(/N/i)
      expect(dialogText).toMatch(/S/i)
      expect(dialogText).toMatch(/J/i)
      expect(dialogText).toMatch(/K/i)
      expect(dialogText).toMatch(/escape/i)
    })

    it('renders shortcuts in kbd elements', async () => {
      const { user } = renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const kbdElements = document.querySelectorAll('kbd')
      expect(kbdElements.length).toBeGreaterThanOrEqual(6)
    })
  })

  describe('dialog close', () => {
    it('has a close button', async () => {
      const { user } = renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('closes dialog when close button is clicked', async () => {
      const { user } = renderComponent()

      const trigger = screen.getByRole('button', {
        name: /keyboard shortcuts/i
      })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      // Dialog should be hidden
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })
})
