/**
 * Tests for SearchSectionCalendar component
 */

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import SearchSectionCalendar from './SearchSectionCalendar.vue'

import type { DayCount } from '@/api/search'

const routerLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to']
}

function renderCalendar(
  props: Partial<{
    dayCounts: DayCount[]
    month: string
    isLoading: boolean
  }> = {}
) {
  return render(SearchSectionCalendar, {
    props: {
      dayCounts: [],
      month: '2026-02',
      isLoading: false,
      ...props
    },
    global: { stubs: { RouterLink: routerLinkStub } }
  })
}

describe('SearchSectionCalendar', () => {
  it('shows a loading spinner while isLoading is true', () => {
    renderCalendar({ isLoading: true })

    expect(screen.getByTestId('calendar-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument()
  })

  it('renders the month/year label', () => {
    renderCalendar({ month: '2026-02' })

    expect(screen.getByText('February 2026')).toBeInTheDocument()
  })

  it('renders one day cell per day in the month', () => {
    renderCalendar({ month: '2026-02' }) // 28 days

    expect(screen.getAllByTestId('calendar-day')).toHaveLength(28)
  })

  it('shows a match-count badge only on days with matches', () => {
    renderCalendar({
      month: '2026-02',
      dayCounts: [{ assignedDay: '2026-02-05', count: 3 }]
    })

    expect(screen.getAllByTestId('calendar-day-badge')).toHaveLength(1)
    expect(screen.getByTestId('calendar-day-badge')).toHaveTextContent('3')
  })

  it('links each day cell to its entry-day route', () => {
    renderCalendar({ month: '2026-02' })

    const firstDay = screen.getAllByTestId('calendar-day')[0]
    expect(firstDay).toHaveAttribute('href', '/entries/2026-02-01')
  })

  it('emits prev-month and next-month when the nav buttons are clicked', async () => {
    const user = userEvent.setup()
    const result = renderCalendar()

    await user.click(screen.getByRole('button', { name: /previous month/i }))
    await user.click(screen.getByRole('button', { name: /next month/i }))

    expect(result.emitted()['prev-month']).toBeTruthy()
    expect(result.emitted()['next-month']).toBeTruthy()
  })
})
