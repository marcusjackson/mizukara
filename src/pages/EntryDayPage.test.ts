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

import { buildEntryDayRoute, ROUTES } from '@/router/routes'

import EntryDayPage from './EntryDayPage.vue'

import type { Database } from 'sql.js'

// Hoist mock function instances so they can be re-configured in beforeEach
// after clearMocks runs (vitest config has clearMocks: true).
const {
  mockFetchTags,
  mockFindByEntryId,
  mockFindByEntryIds,
  mockFindEntriesByTags
} = vi.hoisted(() => ({
  mockFetchTags: vi.fn(),
  mockFindByEntryId: vi.fn(),
  mockFindByEntryIds: vi.fn(),
  mockFindEntriesByTags: vi.fn()
}))

// Mock database composable
vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: vi.fn()
}))

// Mock keyboard shortcuts composable
vi.mock('@/shared/composables/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn()
}))

// Mock entry-tag queries — EntryDayPage renders EntryDayViewRoot which calls
// findByEntryIds; the entries test database doesn't have an entry_tags table.
vi.mock('@/api/entry-tags/entry-tag-queries', () => ({
  findByEntryIds: mockFindByEntryIds,
  findByEntryId: mockFindByEntryId,
  findEntriesByTags: mockFindEntriesByTags
}))

// Mock useTags composable — the entries test database doesn't have a tags table.
vi.mock('@/modules/tags/composables/use-tags', () => ({
  useTags: () => ({
    tags: [],
    tagOptions: [],
    filteredEntries: [],
    isLoading: { value: false },
    fetchTags: mockFetchTags,
    fetchEntriesByTags: vi.fn().mockResolvedValue(undefined)
  })
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

    // Re-setup mock implementations after clearAllMocks.
    mockFindByEntryId.mockReturnValue([])
    mockFindByEntryIds.mockReturnValue(new Map())
    mockFindEntriesByTags.mockReturnValue([])
    mockFetchTags.mockResolvedValue(undefined)

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
          path: ROUTES.ENTRY_DAY,
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

    await renderPage(buildEntryDayRoute(testDate))

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

    await renderPage(buildEntryDayRoute(testDate))

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

    const { container } = await renderPage(buildEntryDayRoute(testDate))

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

    await router.push(buildEntryDayRoute('2026-02-10'))
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
    await router.push(buildEntryDayRoute('2026-02-11'))

    await waitFor(() => {
      expect(screen.getByText('Entry Feb 11')).toBeInTheDocument()
      expect(screen.queryByText('Entry Feb 10')).not.toBeInTheDocument()
    })
  })
})
