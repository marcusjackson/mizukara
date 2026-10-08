/**
 * Tests for use-search composable
 */

import { describe, expect, it, vi } from 'vitest'

// =============================================================================
// Mocks
// =============================================================================

const mockDatabase = {}

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: () => ({
    database: { value: mockDatabase }
  })
}))

const { mockFindDayCounts, mockSearch, mockShowError } = vi.hoisted(() => ({
  mockFindDayCounts: vi.fn(),
  mockSearch: vi.fn(),
  mockShowError: vi.fn()
}))

vi.mock('@/api/search', () => ({
  findDayCounts: mockFindDayCounts,
  search: mockSearch
}))

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({
    error: mockShowError,
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  })
}))

// Import after mocks
import { useSearch } from './use-search'

import type { Entry } from '@/shared/types/entry-types'

// =============================================================================
// Fixtures
// =============================================================================

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry-1',
    content: 'Test entry',
    createdAt: 1000,
    updatedAt: 1000,
    assignedDay: '2026-02-28',
    orderPosition: 0,
    isDeleted: false,
    ...overrides
  }
}

function resetMocks() {
  mockSearch.mockReset()
  mockFindDayCounts.mockReset()
  mockShowError.mockReset()
}

// =============================================================================
// Tests
// =============================================================================

describe('useSearch', () => {
  describe('initial state', () => {
    it('returns expected interface', () => {
      resetMocks()
      const result = useSearch()

      expect(result).toHaveProperty('entries')
      expect(result).toHaveProperty('dayCounts')
      expect(result).toHaveProperty('isLoading')
      expect(result).toHaveProperty('isLoadingDayCounts')
      expect(result).toHaveProperty('runSearch')
      expect(result).toHaveProperty('runDayCounts')
    })

    it('starts with empty entries', () => {
      resetMocks()
      const { entries } = useSearch()

      expect(entries.value).toEqual([])
    })

    it('starts with isLoading false', () => {
      resetMocks()
      const { isLoading } = useSearch()

      expect(isLoading.value).toBe(false)
    })
  })

  describe('runSearch', () => {
    it('populates entries from search() result', async () => {
      resetMocks()
      const entry = makeEntry()
      mockSearch.mockReturnValue([entry])

      const { entries, runSearch } = useSearch()
      await runSearch({ query: 'run' }, true)

      expect(entries.value).toEqual([entry])
    })

    it('calls search with the database, filters, and capped option', async () => {
      resetMocks()
      mockSearch.mockReturnValue([])

      const { runSearch } = useSearch()
      await runSearch({ query: 'run', tagIds: ['tag-1'] }, false)

      expect(mockSearch).toHaveBeenCalledWith(
        mockDatabase,
        { query: 'run', tagIds: ['tag-1'] },
        { capped: false }
      )
    })

    it('sets isLoading to false after search completes', async () => {
      resetMocks()
      mockSearch.mockReturnValue([])

      const { isLoading, runSearch } = useSearch()
      await runSearch({}, true)

      expect(isLoading.value).toBe(false)
    })

    it('shows error toast when search throws', async () => {
      resetMocks()
      mockSearch.mockImplementation(() => {
        throw new Error('Query failed')
      })

      const { runSearch } = useSearch()
      await runSearch({ query: 'x' }, true)

      expect(mockShowError).toHaveBeenCalledWith('Query failed')
    })

    it('clears the previous results when the search throws', async () => {
      resetMocks()
      mockSearch.mockReturnValueOnce([makeEntry()])
      const { entries, runSearch } = useSearch()
      await runSearch({ query: 'first' }, true)
      expect(entries.value).toHaveLength(1)

      mockSearch.mockImplementation(() => {
        throw new Error('Query failed')
      })
      await runSearch({ query: 'second' }, true)

      expect(entries.value).toEqual([])
    })

    it('sets isLoading to false after error', async () => {
      resetMocks()
      mockSearch.mockImplementation(() => {
        throw new Error('Query failed')
      })

      const { isLoading, runSearch } = useSearch()
      await runSearch({ query: 'x' }, true)

      expect(isLoading.value).toBe(false)
    })
  })

  describe('runDayCounts', () => {
    it('populates dayCounts from findDayCounts() result', async () => {
      resetMocks()
      const dayCount = { assignedDay: '2026-02-05', count: 2 }
      mockFindDayCounts.mockReturnValue([dayCount])

      const { dayCounts, runDayCounts } = useSearch()
      await runDayCounts({ query: 'run' }, '2026-02')

      expect(dayCounts.value).toEqual([dayCount])
    })

    it('calls findDayCounts with the database, filters, and month', async () => {
      resetMocks()
      mockFindDayCounts.mockReturnValue([])

      const { runDayCounts } = useSearch()
      await runDayCounts({ query: 'run', tagIds: ['tag-1'] }, '2026-02')

      expect(mockFindDayCounts).toHaveBeenCalledWith(
        mockDatabase,
        { query: 'run', tagIds: ['tag-1'] },
        '2026-02'
      )
    })

    it('sets isLoadingDayCounts to false after the query completes', async () => {
      resetMocks()
      mockFindDayCounts.mockReturnValue([])

      const { isLoadingDayCounts, runDayCounts } = useSearch()
      await runDayCounts({}, '2026-02')

      expect(isLoadingDayCounts.value).toBe(false)
    })

    it('clears the previous counts when the query throws', async () => {
      resetMocks()
      mockFindDayCounts.mockReturnValueOnce([
        { assignedDay: '2026-02-03', count: 2 }
      ])
      const { dayCounts, runDayCounts } = useSearch()
      await runDayCounts({ query: 'x' }, '2026-02')
      expect(dayCounts.value).toHaveLength(1)

      mockFindDayCounts.mockImplementation(() => {
        throw new Error('Query failed')
      })
      await runDayCounts({ query: 'y' }, '2026-02')

      expect(dayCounts.value).toEqual([])
    })

    it('shows error toast when findDayCounts throws', async () => {
      resetMocks()
      mockFindDayCounts.mockImplementation(() => {
        throw new Error('Query failed')
      })

      const { runDayCounts } = useSearch()
      await runDayCounts({ query: 'x' }, '2026-02')

      expect(mockShowError).toHaveBeenCalledWith('Query failed')
    })
  })
})
