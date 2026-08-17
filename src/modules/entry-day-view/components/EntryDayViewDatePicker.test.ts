/**
 * Tests for EntryDayViewDatePicker component
 *
 * Modal dialog for direct date navigation.
 * Validates date input and emits selection events.
 *
 * Note: BaseDialog is mocked because Reka UI's DialogPortal
 * uses Teleport which doesn't render properly in jsdom.
 */

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import EntryDayViewDatePicker from './EntryDayViewDatePicker.vue'

/**
 * Mock BaseDialog to render slot content directly.
 * Avoids Reka UI's DialogPortal/Teleport which doesn't work in jsdom.
 */
vi.mock('@/base/components/BaseDialog.vue', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const vue = require('vue') as typeof import('vue')
  /* eslint-enable @typescript-eslint/no-require-imports */
  const mock: Record<string, unknown> = {}
  mock['default'] = vue.defineComponent({
    name: 'BaseDialog',
    props: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      open: { type: Boolean, default: false }
    },
    emits: ['update:open'],
    setup(
      props: { open: boolean; title: string },
      {
        slots
      }: {
        slots: Record<string, (() => unknown) | undefined>
      }
    ) {
      return () => {
        if (!props.open) return null
        return vue.h('div', { role: 'dialog', 'aria-label': props.title }, [
          props.title ? vue.h('h2', props.title) : null,
          slots['default']?.() as never
        ])
      }
    }
  })
  return mock
})

describe('EntryDayViewDatePicker', () => {
  const defaultProps = {
    open: true,
    initialDate: '2026-02-14'
  }

  it('renders dialog when open prop is true', () => {
    render(EntryDayViewDatePicker, { props: defaultProps })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Jump to Date')).toBeInTheDocument()
  })

  it('does not render dialog when open prop is false', () => {
    render(EntryDayViewDatePicker, {
      props: { ...defaultProps, open: false }
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('pre-fills input with initialDate', () => {
    render(EntryDayViewDatePicker, { props: defaultProps })

    const input = screen.getByLabelText(/select date/i)
    expect(input).toHaveValue('2026-02-14')
  })

  it('updates pre-filled value when initialDate changes', async () => {
    const { rerender } = render(EntryDayViewDatePicker, {
      props: defaultProps
    })

    expect(screen.getByLabelText(/select date/i)).toHaveValue('2026-02-14')

    await rerender({ open: true, initialDate: '2026-03-01' })

    expect(screen.getByLabelText(/select date/i)).toHaveValue('2026-03-01')
  })

  it('emits date-selected with valid ISO date on confirm', async () => {
    const user = userEvent.setup()
    const { emitted } = render(EntryDayViewDatePicker, {
      props: defaultProps
    })

    const input = screen.getByLabelText(/select date/i)
    await user.clear(input)
    await user.type(input, '2026-03-01')

    const confirmButton = screen.getByRole('button', { name: /go to date/i })
    await user.click(confirmButton)

    expect(emitted()['date-selected']).toBeTruthy()
    expect(emitted()['date-selected']![0]).toEqual(['2026-03-01'])
  })

  it('emits close on cancel button click', async () => {
    const user = userEvent.setup()
    const { emitted } = render(EntryDayViewDatePicker, {
      props: defaultProps
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(emitted()['close']).toBeTruthy()
  })

  it('shows validation error for invalid date format', async () => {
    const user = userEvent.setup()
    render(EntryDayViewDatePicker, { props: defaultProps })

    const input = screen.getByLabelText(/select date/i)
    await user.clear(input)
    await user.type(input, 'invalid-date')

    const confirmButton = screen.getByRole('button', { name: /go to date/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(
        screen.getByText(/valid date in YYYY-MM-DD format/i)
      ).toBeInTheDocument()
    })
  })

  it('prevents submission of invalid date', async () => {
    const user = userEvent.setup()
    const { emitted } = render(EntryDayViewDatePicker, {
      props: defaultProps
    })

    const input = screen.getByLabelText(/select date/i)
    await user.clear(input)
    await user.type(input, '2026-13-45')

    const confirmButton = screen.getByRole('button', { name: /go to date/i })
    await user.click(confirmButton)

    // Should not emit date-selected for invalid date
    expect(emitted()['date-selected']).toBeFalsy()
  })

  it('clears validation error when input changes', async () => {
    const user = userEvent.setup()
    render(EntryDayViewDatePicker, { props: defaultProps })

    const input = screen.getByLabelText(/select date/i)
    await user.clear(input)
    await user.type(input, 'invalid')

    const confirmButton = screen.getByRole('button', { name: /go to date/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(
        screen.getByText(/valid date in YYYY-MM-DD format/i)
      ).toBeInTheDocument()
    })

    // Type a valid date to clear error
    await user.clear(input)
    await user.type(input, '2026-03-01')

    expect(
      screen.queryByText(/valid date in YYYY-MM-DD format/i)
    ).not.toBeInTheDocument()
  })

  it('confirms with Enter key', async () => {
    const user = userEvent.setup()
    const { emitted } = render(EntryDayViewDatePicker, {
      props: defaultProps
    })

    const input = screen.getByLabelText(/select date/i)
    await user.clear(input)
    await user.type(input, '2026-03-01')
    await user.keyboard('{Enter}')

    expect(emitted()['date-selected']).toBeTruthy()
    expect(emitted()['date-selected']![0]).toEqual(['2026-03-01'])
  })

  it('renders with accessible button labels', () => {
    render(EntryDayViewDatePicker, { props: defaultProps })

    expect(
      screen.getByRole('button', { name: /go to date/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('emits date-selected with pre-filled date when confirmed without changes', async () => {
    const user = userEvent.setup()
    const { emitted } = render(EntryDayViewDatePicker, {
      props: defaultProps
    })

    const confirmButton = screen.getByRole('button', { name: /go to date/i })
    await user.click(confirmButton)

    expect(emitted()['date-selected']).toBeTruthy()
    expect(emitted()['date-selected']![0]).toEqual(['2026-02-14'])
  })
})
