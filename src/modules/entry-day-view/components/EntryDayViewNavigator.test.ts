/**
 * Tests for EntryDayViewNavigator component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import EntryDayViewNavigator from './EntryDayViewNavigator.vue'

describe('EntryDayViewNavigator', () => {
  it('displays both date formats (CSS controls visibility)', () => {
    const currentDate = '2026-02-10'

    render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    // Both formats are rendered, CSS media queries control visibility
    expect(screen.getByText('Tuesday, February 10, 2026')).toBeInTheDocument()
    expect(screen.getByText('Tue, Feb 10, 2026')).toBeInTheDocument()
  })

  it('emits prev-day event when Previous button is clicked', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    const prevButton = screen.getByRole('button', { name: /previous/i })
    await user.click(prevButton)

    expect(emitted()['prev-day']).toBeTruthy()
  })

  it('emits next-day event when Next button is clicked', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(emitted()['next-day']).toBeTruthy()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    const prevButton = screen.getByRole('button', { name: /previous/i })
    const dateButton = screen.getByRole('button', { name: /jump to date/i })
    const nextButton = screen.getByRole('button', { name: /next/i })

    // Tab to first button (prev)
    await user.tab()
    expect(prevButton).toHaveFocus()

    // Tab to date button
    await user.tab()
    expect(dateButton).toHaveFocus()

    // Tab to next button
    await user.tab()
    expect(nextButton).toHaveFocus()

    // Activate with Enter
    await user.keyboard('{Enter}')
    expect(emitted()['next-day']).toBeTruthy()
  })

  it('applies correct CSS classes', () => {
    const currentDate = '2026-02-10'

    render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('entry-day-view-navigator')
  })

  it('updates formatted date when currentDate prop changes', async () => {
    const { rerender } = render(EntryDayViewNavigator, {
      props: { currentDate: '2026-02-10' }
    })

    expect(screen.getByText('Tuesday, February 10, 2026')).toBeInTheDocument()

    await rerender({ currentDate: '2026-02-11' })

    expect(screen.getByText('Wednesday, February 11, 2026')).toBeInTheDocument()
    expect(
      screen.queryByText('Tuesday, February 10, 2026')
    ).not.toBeInTheDocument()
  })

  it('handles date at year boundary correctly', () => {
    const currentDate = '2025-12-31'

    render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    expect(screen.getByText('Wednesday, December 31, 2025')).toBeInTheDocument()
  })

  it('formats dates consistently across renders', async () => {
    const currentDate = '2026-02-10'

    const { rerender } = render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    const initialLongDate = screen.getByText('Tuesday, February 10, 2026')
    expect(initialLongDate).toBeInTheDocument()

    // Re-render with same date
    await rerender({ currentDate: '2026-02-10' })

    // Should still show same format
    expect(screen.getByText('Tuesday, February 10, 2026')).toBeInTheDocument()
  })

  it('emits open-date-picker event when date display is clicked', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    const dateButton = screen.getByRole('button', { name: /jump to date/i })
    await user.click(dateButton)

    expect(emitted()['open-date-picker']).toBeTruthy()
  })

  it('date picker trigger is keyboard accessible', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = render(EntryDayViewNavigator, {
      props: { currentDate }
    })

    const dateButton = screen.getByRole('button', { name: /jump to date/i })

    // Tab to date button and activate with Enter
    await user.tab() // prev button
    await user.tab() // date button
    expect(dateButton).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(emitted()['open-date-picker']).toBeTruthy()
  })
})
