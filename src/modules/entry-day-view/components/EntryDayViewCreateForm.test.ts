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

  it('keeps blank-only text and shows the error on Cmd+S', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, '   ')
    await user.keyboard('{Control>}s{/Control}')

    expect(
      await screen.findByText('Please enter some content for your entry')
    ).toBeInTheDocument()
    expect(textarea).toHaveValue('   ')
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

  it('keeps the typed text on submit until the parent resets the form', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Content to keep')
    await user.click(screen.getByRole('button', { name: /new entry/i }))

    await waitFor(() => {
      expect(emitted()['entry-created']).toBeDefined()
    })
    expect(textarea).toHaveValue('Content to keep')
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

  it('Escape key clears content instantly when textarea is empty', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.click(textarea)
    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('dialog', { name: /clear entry/i })
    ).not.toBeInTheDocument()
  })

  it('Escape key with content shows a confirm dialog before clearing', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Content to clear')

    await user.keyboard('{Escape}')

    expect(
      await screen.findByRole('dialog', { name: /clear entry/i })
    ).toBeInTheDocument()
    expect(textarea).toHaveValue('Content to clear')
  })

  it('confirming the clear dialog discards the content', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Content to clear')
    await user.keyboard('{Escape}')

    const confirmButton = await screen.findByRole('button', {
      name: /^clear$/i
    })
    await user.click(confirmButton)

    expect(textarea).toHaveValue('')
  })

  it('cancelling the clear dialog keeps the content', async () => {
    const user = userEvent.setup()
    renderComponent()

    const textarea = screen.getByLabelText(/content/i)
    await user.type(textarea, 'Content to clear')
    await user.keyboard('{Escape}')

    const cancelButton = await screen.findByRole('button', {
      name: /^cancel$/i
    })
    await user.click(cancelButton)

    expect(textarea).toHaveValue('Content to clear')
  })
})
