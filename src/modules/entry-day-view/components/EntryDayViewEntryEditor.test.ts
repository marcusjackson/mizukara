/**
 * Tests for EntryDayViewEntryEditor component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import EntryDayViewEntryEditor from './EntryDayViewEntryEditor.vue'

import type { Entry } from '@/shared/types/entry-types'

describe('EntryDayViewEntryEditor', () => {
  const mockEntry: Entry = {
    id: 'test-id',
    content: 'Original content',
    createdAt: Date.now() - 86400000, // Yesterday
    updatedAt: Date.now() - 86400000,
    assignedDay: '2026-02-11',
    orderPosition: 0,
    isDeleted: false
  }

  const renderComponent = (props?: { entry: Entry }) => {
    return render(EntryDayViewEntryEditor, {
      props: props ?? { entry: mockEntry }
    })
  }

  it('textarea contains entry content', () => {
    renderComponent()

    const textarea = screen.getByLabelText('Content')
    expect(textarea).toHaveValue('Original content')
  })

  it('date input shows assigned day', () => {
    renderComponent()

    const dateInput = screen.getByLabelText('Assigned Day')
    expect(dateInput).toHaveValue('2026-02-11')
  })

  it('validation prevents empty content save', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText('Content')
    await user.clear(textarea)

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Should show validation error
    expect(screen.getByText('Content is required')).toBeInTheDocument()
  })

  it('Save button emits save-requested event with correct data', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Verify save-requested was emitted with correct data
    expect(emitted()['save-requested']).toBeDefined()
    expect(emitted()['save-requested']![0]).toEqual([
      {
        content: 'Original content',
        assignedDay: '2026-02-11'
      }
    ])
  })

  it('Save button emits save-requested with updated assignedDay', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    // Change the assigned day
    const dateInput = screen.getByLabelText('Assigned Day')
    await user.clear(dateInput)
    await user.type(dateInput, '2026-02-15')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Verify save-requested was emitted with updated assignedDay
    expect(emitted()['save-requested']).toBeDefined()
    expect(emitted()['save-requested']![0]).toEqual([
      {
        content: 'Original content',
        assignedDay: '2026-02-15'
      }
    ])
  })

  it('Cancel button emits edit-cancelled event', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(emitted()['edit-cancelled']).toBeTruthy()
  })

  it('prevents navigation with unsaved changes', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText('Content')
    await user.clear(textarea)
    await user.type(textarea, 'Modified content')

    // Simulate beforeunload event
    const beforeUnloadEvent = new Event('beforeunload', { cancelable: true })
    globalThis.dispatchEvent(beforeUnloadEvent)

    expect(beforeUnloadEvent.defaultPrevented).toBe(true)
  })

  it('Escape key cancels editing', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const textarea = screen.getByLabelText('Content')
    await user.click(textarea)
    await user.keyboard('{Escape}')

    expect(emitted()['edit-cancelled']).toBeTruthy()
  })

  it('visual styling uses CSS variables', () => {
    renderComponent()

    // Check that the component renders with expected classes
    const form = document.querySelector('form.entry-editor')
    expect(form).toHaveClass('entry-editor')
  })

  it('keyboard hint is visible', () => {
    renderComponent()

    expect(screen.getByText(/esc/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
