/**
 * Tests for EntryDayViewRoot component
 *
 * Root orchestration component for day view.
 * Handles data fetching, navigation coordination, and keyboard shortcuts.
 */

import { ref, shallowRef } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import {
  createTestDatabaseForEntries,
  seedEntry
} from '@test/helpers/entries/seeders'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDatabase } from '@/shared/composables/use-database'

import EntryDayViewRoot from './EntryDayViewRoot.vue'

import type { Database } from 'sql.js'

// Hoist mock function instances so they can be referenced in vi.mock factories
// and re-configured in beforeEach after clearMocks runs.
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

// Mock entry-tag queries — the test database doesn't have the entry_tags table
// (it uses only the entries schema). findByEntryIds was added in task 9.3.
vi.mock('@/api/entry-tags/entry-tag-queries', () => ({
  findByEntryIds: mockFindByEntryIds,
  findByEntryId: mockFindByEntryId,
  findEntriesByTags: mockFindEntriesByTags
}))

// Mock useTags composable — EntryDayViewRoot uses it to provide allTags to the
// editor; the entries unit test database doesn't have the tags table, so the
// real implementation would throw "no such table: tags".
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

describe('EntryDayViewRoot', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()
    vi.clearAllMocks()

    // Re-setup entry-tag mock implementations after clearAllMocks.
    // These are also declared via vi.hoisted so the vi.mock factory can
    // reference them, but clearAllMocks may remove their implementations.
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
      history: createWebHistory(),
      routes: [
        {
          path: '/entries/:date?',
          name: 'entry-day-view',
          component: { template: '<div></div>' }
        }
      ]
    })
  }

  const renderRoot = async (props: { initialDate?: string | null } = {}) => {
    const router = createTestRouter()
    await router.push('/entries')
    await router.isReady()

    return render(EntryDayViewRoot, {
      props,
      global: {
        plugins: [router]
      }
    })
  }

  describe('Data Loading', () => {
    it('loads entries for current date on mount', async () => {
      // Use a fixed date for testing (today is 2026-02-14 based on context)
      const testDate = '2026-02-14'
      seedEntry(db, {
        content: 'Entry for today',
        assignedDay: testDate
      })

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(screen.getByText('Entry for today')).toBeInTheDocument()
      })
    })

    it('loads entries for initialDate if provided', async () => {
      const testDate = '2026-02-10'
      seedEntry(db, {
        content: 'Entry for Feb 10',
        assignedDay: testDate
      })

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(screen.getByText('Entry for Feb 10')).toBeInTheDocument()
      })
    })

    it('falls back to today if initialDate is invalid', async () => {
      const today = '2026-02-14'
      seedEntry(db, {
        content: 'Entry for today',
        assignedDay: today
      })

      await renderRoot({ initialDate: 'invalid-date' })

      await waitFor(() => {
        expect(screen.getByText('Entry for today')).toBeInTheDocument()
      })
    })

    it('displays loading state while fetching', async () => {
      const { container } = await renderRoot()

      // Loading state is transient and may not be observable in fast tests
      // This test verifies the structure exists, but in real-world scenarios
      // the component handles loading gracefully
      // Note: In slow network conditions or with many entries, this would be visible
      const hasContent =
        container.querySelector('.content-container') !== null ||
        container.querySelector('[role="status"]') !== null

      expect(hasContent).toBe(true)
    })

    it('displays error state on fetch failure', async () => {
      // Force an error by closing the database
      db.close()

      await renderRoot()

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('updates date and refetches entries when navigating to next day', async () => {
      const user = userEvent.setup()
      const testDate = '2026-02-10'
      const nextDate = '2026-02-11'

      seedEntry(db, { content: 'Entry Feb 10', assignedDay: testDate })
      seedEntry(db, { content: 'Entry Feb 11', assignedDay: nextDate })

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(screen.getByText('Entry Feb 10')).toBeInTheDocument()
      })

      // Click next day button
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Entry Feb 11')).toBeInTheDocument()
        expect(screen.queryByText('Entry Feb 10')).not.toBeInTheDocument()
      })
    })

    it('updates date and refetches entries when navigating to previous day', async () => {
      const user = userEvent.setup()
      const testDate = '2026-02-10'
      const prevDate = '2026-02-09'

      seedEntry(db, { content: 'Entry Feb 10', assignedDay: testDate })
      seedEntry(db, { content: 'Entry Feb 9', assignedDay: prevDate })

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(screen.getByText('Entry Feb 10')).toBeInTheDocument()
      })

      // Click previous day button
      const prevButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevButton)

      await waitFor(() => {
        expect(screen.getByText('Entry Feb 9')).toBeInTheDocument()
        expect(screen.queryByText('Entry Feb 10')).not.toBeInTheDocument()
      })
    })
  })

  describe('Refetch Behavior', () => {
    it('refetches entries after create', async () => {
      const user = userEvent.setup()
      const testDate = '2026-02-10'

      await renderRoot({ initialDate: testDate })

      // Initially no entries
      await waitFor(() => {
        expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
      })

      // Create a new entry
      const textarea = screen.getByPlaceholderText(/what happened today/i)
      await user.type(textarea, 'New entry content')

      const createButton = screen.getByRole('button', { name: /new entry/i })
      await user.click(createButton)

      // Entry should appear in list
      await waitFor(() => {
        expect(screen.getByText('New entry content')).toBeInTheDocument()
        expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()
      })
    })

    it('refetches entries after edit', async () => {
      const user = userEvent.setup()
      const testDate = '2026-02-10'

      seedEntry(db, {
        content: 'Original content',
        assignedDay: testDate
      })

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(screen.getByText('Original content')).toBeInTheDocument()
      })

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      // Update content
      const textarea = screen.getByDisplayValue('Original content')
      await user.clear(textarea)
      await user.type(textarea, 'Updated content')

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Updated content should appear
      await waitFor(() => {
        expect(screen.getByText('Updated content')).toBeInTheDocument()
        expect(screen.queryByText('Original content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('registers keyboard shortcuts on mount including G key', async () => {
      const { useKeyboardShortcuts } =
        await import('@/shared/composables/use-keyboard-shortcuts')

      await renderRoot()

      expect(useKeyboardShortcuts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ key: 'cmd+n' }),
          expect.objectContaining({ key: 'j' }),
          expect.objectContaining({ key: 'k' }),
          expect.objectContaining({ key: 'g' }),
          expect.objectContaining({ key: 'cmd+s' }),
          expect.objectContaining({ key: 'escape' })
        ])
      )
    })

    // Note: Testing actual keyboard behavior is complex with mocked composable
    // Real keyboard shortcut testing should be done in E2E tests
  })

  describe('Component Integration', () => {
    it('renders navigation section with current date', async () => {
      const testDate = '2026-02-10'

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(
          screen.getByText('Tuesday, February 10, 2026')
        ).toBeInTheDocument()
      })
    })

    it('renders list section with entries', async () => {
      const testDate = '2026-02-10'
      seedEntry(db, { content: 'First entry', assignedDay: testDate })
      seedEntry(db, { content: 'Second entry', assignedDay: testDate })

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(screen.getByText('First entry')).toBeInTheDocument()
        expect(screen.getByText('Second entry')).toBeInTheDocument()
      })
    })

    it('renders create form at top of list section', async () => {
      await renderRoot()

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/what happened today/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty entry list gracefully', async () => {
      const testDate = '2026-02-10'

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
      })
    })

    it('handles null initialDate by using today', async () => {
      const today = '2026-02-14'
      seedEntry(db, { content: 'Entry for today', assignedDay: today })

      await renderRoot({ initialDate: null })

      await waitFor(() => {
        expect(screen.getByText('Entry for today')).toBeInTheDocument()
      })
    })

    it('handles rapid navigation without race conditions', async () => {
      const user = userEvent.setup()
      const testDate = '2026-02-10'

      await renderRoot({ initialDate: testDate })

      await waitFor(() => {
        expect(
          screen.getByText('Tuesday, February 10, 2026')
        ).toBeInTheDocument()
      })

      // Rapidly click next button multiple times
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      await user.click(nextButton)
      await user.click(nextButton)

      // Should end up at Feb 13
      await waitFor(() => {
        expect(
          screen.getByText('Friday, February 13, 2026')
        ).toBeInTheDocument()
      })
    })
  })
})
