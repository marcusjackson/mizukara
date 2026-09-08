/**
 * Tests for use-search-tag-options composable
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

const { mockFindAllWithCount, mockShowError } = vi.hoisted(() => ({
  mockFindAllWithCount: vi.fn(),
  mockShowError: vi.fn()
}))

vi.mock('@/api/tags/tag-queries', () => ({
  findAllWithCount: mockFindAllWithCount
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
import { useSearchTagOptions } from './use-search-tag-options'

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

function resetMocks() {
  mockFindAllWithCount.mockReset()
  mockShowError.mockReset()
}

// =============================================================================
// Tests
// =============================================================================

describe('useSearchTagOptions', () => {
  it('starts with empty tagOptions', () => {
    resetMocks()
    const { tagOptions } = useSearchTagOptions()

    expect(tagOptions.value).toEqual([])
  })

  it('maps fetched tags to TagInputOption format', async () => {
    resetMocks()
    const tag = makeTag({ id: 'tag-abc', name: 'personal' })
    mockFindAllWithCount.mockReturnValue([tag])

    const { fetchTagOptions, tagOptions } = useSearchTagOptions()
    await fetchTagOptions()

    expect(tagOptions.value).toEqual([{ value: 'tag-abc', label: 'personal' }])
  })

  it('calls findAllWithCount with the database', async () => {
    resetMocks()
    mockFindAllWithCount.mockReturnValue([])

    const { fetchTagOptions } = useSearchTagOptions()
    await fetchTagOptions()

    expect(mockFindAllWithCount).toHaveBeenCalledWith(mockDatabase)
  })

  it('shows error toast when findAllWithCount throws', async () => {
    resetMocks()
    mockFindAllWithCount.mockImplementation(() => {
      throw new Error('DB read error')
    })

    const { fetchTagOptions } = useSearchTagOptions()
    await fetchTagOptions()

    expect(mockShowError).toHaveBeenCalledWith('DB read error')
  })
})
