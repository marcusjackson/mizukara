/**
 * Tests for EntryDayPage component
 *
 * Thin page wrapper for entry day view route.
 * Extracts route parameter and delegates to root component.
 */

import { ref, shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import {
  createTestDatabaseForEntries,
  seedEntry
} from '@test/helpers/entries/seeders'
import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDatabase } from '@/shared/composables/use-database'

import EntryDayPage from './EntryDayPage.vue'

import type { Database } from 'sql.js'

// Mock database composable
vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: vi.fn()
}))

// Mock keyboard shortcuts composable
vi.mock('@/shared/composables/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn()
}))

// Mock date utils to return consistent test date
vi.mock('@/shared/utils/date-utils', async () => {
  const actual = await vi.importActual('@/shared/utils/date-utils')
  return {
    ...actual,
    getToday: vi.fn(() => '2026-02-14')
  }
})

describe('EntryDayPage', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()
    vi.clearAllMocks()

    // Mock useDatabase to return the test database
    vi.mocked(useDatabase).mockReturnValue({
      database: shallowRef(db),
      isInitialized: ref(true),
      isInitializing: ref(false),
      initError: ref(null),
      initialize: vi.fn(),
      persist: vi.fn(),
      exec: vi.fn(),
      run: vi.fn(),
      replaceDatabase: vi.fn()
    })
  })

  const createTestRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/entries/:date?',
          name: 'entry-day-view',
          component: EntryDayPage
        }
      ]
    })
  }

  const renderPage = async (route = '/entries') => {
    const router = createTestRouter()
    await router.push(route)
    await router.isReady()

    return render(EntryDayPage, {
      global: {
        plugins: [router]
      }
    })
  }

  it('renders root component', async () => {
    const today = '2026-02-14'
    seedEntry(db, {
      content: 'Test entry',
      assignedDay: today
    })

    await renderPage('/entries')

    // Verify root component is rendered by checking for entry content
    await waitFor(() => {
      expect(screen.getByText('Test entry')).toBeInTheDocument()
    })
  })

  it('passes route date parameter to root as initialDate', async () => {
    const testDate = '2026-02-10'
    seedEntry(db, {
      content: 'Entry for Feb 10',
      assignedDay: testDate
    })

    await renderPage(`/entries/${testDate}`)

    // Verify correct date is displayed in navigation
    await waitFor(() => {
      expect(screen.getByText('Tuesday, February 10, 2026')).toBeInTheDocument()
    })

    // Verify correct entry is displayed
    await waitFor(() => {
      expect(screen.getByText('Entry for Feb 10')).toBeInTheDocument()
    })
  })

  it('passes null when no route parameter', async () => {
    const today = '2026-02-14'
    seedEntry(db, {
      content: 'Entry for today',
      assignedDay: today
    })

    await renderPage('/entries')

    // Should default to today's date
    await waitFor(() => {
      expect(screen.getByText('Entry for today')).toBeInTheDocument()
    })
  })

  it('handles different date formats in route', async () => {
    const testDate = '2026-12-25'
    seedEntry(db, {
      content: 'Christmas entry',
      assignedDay: testDate
    })

    await renderPage(`/entries/${testDate}`)

    await waitFor(() => {
      expect(screen.getByText('Christmas entry')).toBeInTheDocument()
    })
  })

  it('delegates all functionality to root component', async () => {
    const testDate = '2026-02-10'
    seedEntry(db, {
      content: 'Test entry',
      assignedDay: testDate
    })

    const { container } = await renderPage(`/entries/${testDate}`)

    // Page should have minimal DOM structure - just the root component
    await waitFor(() => {
      expect(container.querySelector('.entry-day-view-root')).toBeTruthy()
    })
  })

  it('updates when route parameter changes', async () => {
    const router = createTestRouter()

    seedEntry(db, {
      content: 'Entry Feb 10',
      assignedDay: '2026-02-10'
    })
    seedEntry(db, {
      content: 'Entry Feb 11',
      assignedDay: '2026-02-11'
    })

    await router.push('/entries/2026-02-10')
    await router.isReady()

    render(EntryDayPage, {
      global: {
        plugins: [router],
        provide: { database: db }
      }
    })
    await waitFor(() => {
      expect(screen.getByText('Entry Feb 10')).toBeInTheDocument()
    })

    // Change route
    await router.push('/entries/2026-02-11')

    await waitFor(() => {
      expect(screen.getByText('Entry Feb 11')).toBeInTheDocument()
      expect(screen.queryByText('Entry Feb 10')).not.toBeInTheDocument()
    })
  })
})
