/**
 * Tests for use-tags composable
 *
 * Tags data composable providing reactive tag list, tag options for inputs,
 * and filtered entries by tag selection.
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

const { mockFindAllWithCount, mockFindEntriesByTags, mockShowError } =
  vi.hoisted(() => ({
    mockFindAllWithCount: vi.fn(),
    mockFindEntriesByTags: vi.fn(),
    mockShowError: vi.fn()
  }))

vi.mock('@/api/tags/tag-queries', () => ({
  findAllWithCount: mockFindAllWithCount
}))

vi.mock('@/api/entry-tags/entry-tag-queries', () => ({
  findByEntryId: vi.fn(),
  findByEntryIds: vi.fn(),
  findEntriesByTags: mockFindEntriesByTags
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
import { useTags } from './use-tags'

import type { Entry } from '@/shared/types/entry-types'
import type { TagWithCount } from '@/shared/types/tag-types'

// =============================================================================
// Fixtures
// =============================================================================

function makeTag(overrides: Partial<TagWithCount> = {}): TagWithCount {
  return {
    id: 'tag-1',
    name: 'work',
    createdAt: 1000,
    updatedAt: 1000,
    isDeleted: false,
    entryCount: 2,
    ...overrides
  }
}

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

// =============================================================================
// Tests
// =============================================================================

function resetMocks() {
  mockFindAllWithCount.mockReset()
  mockFindEntriesByTags.mockReset()
  mockShowError.mockReset()
}

describe('useTags', () => {
  describe('initial state', () => {
    it('returns expected interface', () => {
      resetMocks()
      const result = useTags()

      expect(result).toHaveProperty('tags')
      expect(result).toHaveProperty('tagOptions')
      expect(result).toHaveProperty('filteredEntries')
      expect(result).toHaveProperty('isLoading')
      expect(result).toHaveProperty('fetchTags')
      expect(result).toHaveProperty('fetchEntriesByTags')
    })

    it('starts with empty tags list', () => {
      resetMocks()
      const { tags } = useTags()

      expect(tags.value).toEqual([])
    })

    it('starts with empty filteredEntries', () => {
      resetMocks()
      const { filteredEntries } = useTags()

      expect(filteredEntries.value).toEqual([])
    })

    it('starts with isLoading false', () => {
      resetMocks()
      const { isLoading } = useTags()

      expect(isLoading.value).toBe(false)
    })

    it('starts with empty tagOptions', () => {
      resetMocks()
      const { tagOptions } = useTags()

      expect(tagOptions.value).toEqual([])
    })
  })

  describe('fetchTags', () => {
    it('sets tags from findAllWithCount result', async () => {
      resetMocks()
      const tag = makeTag()
      mockFindAllWithCount.mockReturnValue([tag])

      const { fetchTags, tags } = useTags()
      await fetchTags()

      expect(tags.value).toEqual([tag])
    })

    it('calls findAllWithCount with the database', async () => {
      resetMocks()
      mockFindAllWithCount.mockReturnValue([])

      const { fetchTags } = useTags()
      await fetchTags()

      expect(mockFindAllWithCount).toHaveBeenCalledWith(mockDatabase)
    })

    it('sets isLoading to false after fetch completes', async () => {
      resetMocks()
      mockFindAllWithCount.mockReturnValue([])

      const { fetchTags, isLoading } = useTags()
      await fetchTags()

      expect(isLoading.value).toBe(false)
    })

    it('shows error toast when findAllWithCount throws', async () => {
      resetMocks()
      mockFindAllWithCount.mockImplementation(() => {
        throw new Error('DB read error')
      })

      const { fetchTags } = useTags()
      await fetchTags()

      expect(mockShowError).toHaveBeenCalledWith('DB read error')
    })

    it('sets isLoading to false after error', async () => {
      resetMocks()
      mockFindAllWithCount.mockImplementation(() => {
        throw new Error('DB read error')
      })

      const { fetchTags, isLoading } = useTags()
      await fetchTags()

      expect(isLoading.value).toBe(false)
    })

    it('includes zero-count tags in the result', async () => {
      resetMocks()
      const zeroCountTag = makeTag({ entryCount: 0 })
      mockFindAllWithCount.mockReturnValue([zeroCountTag])

      const { fetchTags, tags } = useTags()
      await fetchTags()

      expect(tags.value).toHaveLength(1)
      expect(tags.value[0]?.entryCount).toBe(0)
    })
  })

  describe('tagOptions', () => {
    it('maps tags to TagInputOption format', async () => {
      resetMocks()
      const tag = makeTag({ id: 'tag-abc', name: 'personal' })
      mockFindAllWithCount.mockReturnValue([tag])

      const { fetchTags, tagOptions } = useTags()
      await fetchTags()

      expect(tagOptions.value).toEqual([
        { value: 'tag-abc', label: 'personal' }
      ])
    })

    it('updates tagOptions reactively when tags change', async () => {
      resetMocks()
      mockFindAllWithCount.mockReturnValueOnce([])

      const { fetchTags, tagOptions } = useTags()
      await fetchTags()
      expect(tagOptions.value).toEqual([])

      const tag = makeTag({ id: 'tag-x', name: 'health' })
      mockFindAllWithCount.mockReturnValueOnce([tag])
      await fetchTags()

      expect(tagOptions.value).toEqual([{ value: 'tag-x', label: 'health' }])
    })
  })

  describe('fetchEntriesByTags', () => {
    it('populates filteredEntries with matching entries', async () => {
      resetMocks()
      const entry = makeEntry()
      mockFindEntriesByTags.mockReturnValue([entry])

      const { fetchEntriesByTags, filteredEntries } = useTags()
      await fetchEntriesByTags(['tag-1'])

      expect(filteredEntries.value).toEqual([entry])
    })

    it('calls findEntriesByTags with database and tagIds', async () => {
      resetMocks()
      mockFindEntriesByTags.mockReturnValue([])

      const { fetchEntriesByTags } = useTags()
      await fetchEntriesByTags(['tag-1', 'tag-2'])

      expect(mockFindEntriesByTags).toHaveBeenCalledWith(mockDatabase, [
        'tag-1',
        'tag-2'
      ])
    })

    it('clears filteredEntries when tagIds is empty', async () => {
      resetMocks()
      const entry = makeEntry()
      mockFindEntriesByTags.mockReturnValue([entry])

      const { fetchEntriesByTags, filteredEntries } = useTags()
      await fetchEntriesByTags(['tag-1'])
      expect(filteredEntries.value).toHaveLength(1)

      await fetchEntriesByTags([])
      expect(filteredEntries.value).toEqual([])
    })

    it('does not call findEntriesByTags when tagIds is empty', async () => {
      resetMocks()
      mockFindEntriesByTags.mockReturnValue([])

      const { fetchEntriesByTags } = useTags()
      await fetchEntriesByTags([])

      expect(mockFindEntriesByTags).not.toHaveBeenCalled()
    })

    it('shows error toast when findEntriesByTags throws', async () => {
      resetMocks()
      mockFindEntriesByTags.mockImplementation(() => {
        throw new Error('Query failed')
      })

      const { fetchEntriesByTags } = useTags()
      await fetchEntriesByTags(['tag-1'])

      expect(mockShowError).toHaveBeenCalledWith('Query failed')
    })
  })
})
