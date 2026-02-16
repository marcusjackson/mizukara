/**
 * Tests for EntryDayViewSectionNavigation component
 *
 * Section component that orchestrates day navigation.
 * Thin wrapper around EntryDayViewNavigator that emits events
 * (no handler props - follows Vue best practices).
 */

import { createMemoryHistory, createRouter } from 'vue-router'

import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import EntryDayViewSectionNavigation from './EntryDayViewSectionNavigation.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      {
        path: '/entries/:date?',
        name: 'entry-day-view',
        component: { template: '<div />' }
      },
      {
        path: '/settings',
        name: 'settings',
        component: { template: '<div />' }
      }
    ]
  })
}

function renderNavigation(currentDate: string) {
  return render(EntryDayViewSectionNavigation, {
    props: { currentDate },
    global: {
      plugins: [createTestRouter()]
    }
  })
}

describe('EntryDayViewSectionNavigation', () => {
  it('renders navigator component', () => {
    const currentDate = '2026-02-10'

    renderNavigation(currentDate)

    // Verify navigator is present by checking for its date display
    expect(screen.getByText('Tuesday, February 10, 2026')).toBeInTheDocument()
  })

  it('passes currentDate prop to navigator', () => {
    const currentDate = '2026-02-11'

    renderNavigation(currentDate)

    // Verify correct date is displayed
    expect(screen.getByText('Wednesday, February 11, 2026')).toBeInTheDocument()
  })

  it('emits prev-day when prev-day event is emitted from navigator', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = renderNavigation(currentDate)

    const prevButton = screen.getByRole('button', { name: /previous/i })
    await user.click(prevButton)

    expect(emitted('prev-day')).toHaveLength(1)
  })

  it('emits next-day when next-day event is emitted from navigator', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = renderNavigation(currentDate)

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(emitted('next-day')).toHaveLength(1)
  })

  it('supports keyboard navigation through child navigator', async () => {
    const user = userEvent.setup()
    const currentDate = '2026-02-10'

    const { emitted } = renderNavigation(currentDate)

    const prevButton = screen.getByRole('button', { name: /previous/i })

    // Tab to first button and activate
    await user.tab()
    expect(prevButton).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(emitted('prev-day')).toHaveLength(1)
  })

  it('provides proper section semantics', () => {
    const currentDate = '2026-02-10'

    const { container } = renderNavigation(currentDate)

    // Verify section semantic structure
    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
  })

  it('renders settings link with accessible label', () => {
    renderNavigation('2026-02-10')

    const settingsLink = screen.getByRole('link', { name: /settings/i })
    expect(settingsLink).toBeInTheDocument()
  })

  it('settings link points to /settings route', () => {
    renderNavigation('2026-02-10')

    const settingsLink = screen.getByRole('link', { name: /settings/i })
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })
})
