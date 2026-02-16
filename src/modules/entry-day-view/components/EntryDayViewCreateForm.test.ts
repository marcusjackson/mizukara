/**
 * Tests for EntryDayViewCreateForm component
 */

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import EntryDayViewCreateForm from './EntryDayViewCreateForm.vue'

describe('EntryDayViewCreateForm', () => {
  const defaultAssignedDay = '2026-02-11'

  const renderComponent = (props: { defaultAssignedDay?: string } = {}) => {
    return render(EntryDayViewCreateForm, {
      props: {
        defaultAssignedDay: props.defaultAssignedDay ?? defaultAssignedDay
      }
    })
  }

  it('renders with textarea and button', () => {
    renderComponent()

    expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /new entry/i })
    ).toBeInTheDocument()
  })

  it('Save button disabled when textarea empty', () => {
    renderComponent()

    const saveButton = screen.getByRole('button', { name: /new entry/i })
    expect(saveButton).toBeDisabled()
  })

  it('Save button enabled when textarea has content', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Test content')

    const saveButton = screen.getByRole('button', { name: /new entry/i })
    expect(saveButton).toBeEnabled()
  })

  it('validation prevents empty content save', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    // Type only whitespace - button becomes enabled but validation should fail
    await user.type(textarea, '   ')

    const saveButton = screen.getByRole('button', { name: /new entry/i })
    await user.click(saveButton)

    // Should not have emitted the event
    expect(emitted()['entry-created']).toBeUndefined()
  })

  it('emits entry-created event on successful save', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'New entry content')

    const saveButton = screen.getByRole('button', { name: /new entry/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(emitted()['entry-created']).toBeDefined()
    })
    expect(emitted()['entry-created']![0]).toEqual([
      {
        content: 'New entry content',
        assignedDay: defaultAssignedDay
      }
    ])
  })

  it('textarea clears after successful save', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Content to clear')

    const saveButton = screen.getByRole('button', { name: /new entry/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('focus returns to textarea after save', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByRole('textbox', { name: /content/i })
    await user.type(textarea, 'Content')

    const saveButton = screen.getByRole('button', { name: /new entry/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(textarea).toHaveFocus()
    })
  })

  it('Cmd/Ctrl+S shortcut triggers save', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Shortcut save content')
    await user.keyboard('{Control>}s{/Control}')

    await waitFor(() => {
      expect(emitted()['entry-created']).toBeDefined()
    })
  })

  it('Escape key clears content', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Content to clear')

    await user.keyboard('{Escape}')

    expect(textarea).toHaveValue('')
  })
})
