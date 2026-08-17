/**
 * Tests for use-tag-mutations composable
 *
 * Tag lifecycle mutations with toast feedback:
 * createTag, renameTag, deleteTag (cascades to entry_tags).
 */

import { describe, expect, it, vi } from 'vitest'

import { TagValidationError } from '@/api/tags/tag-validation'

// =============================================================================
// Mocks
// =============================================================================

const mockDatabase = {}

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: () => ({
    database: { value: mockDatabase }
  })
}))

const mockShowError = vi.fn()
const mockShowSuccess = vi.fn()

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({
    error: mockShowError,
    success: mockShowSuccess
  })
}))

const { mockCreateTagApi, mockRenameTagApi, mockSoftDeleteTagApi } = vi.hoisted(
  () => ({
    mockCreateTagApi: vi.fn(),
    mockRenameTagApi: vi.fn(),
    mockSoftDeleteTagApi: vi.fn()
  })
)

vi.mock('@/api/tags/tag-mutations', () => ({
  createTag: mockCreateTagApi,
  renameTag: mockRenameTagApi,
  softDeleteTag: mockSoftDeleteTagApi
}))

// Import after mocks
import { useTagMutations } from './use-tag-mutations'

import type { Tag } from '@/shared/types/tag-types'

// =============================================================================
// Fixtures
// =============================================================================

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'tag-1',
    name: 'work',
    createdAt: 1000,
    updatedAt: 1000,
    isDeleted: false,
    ...overrides
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('useTagMutations', () => {
  function resetMocks() {
    mockCreateTagApi.mockReset()
    mockRenameTagApi.mockReset()
    mockSoftDeleteTagApi.mockReset()
    mockShowError.mockReset()
    mockShowSuccess.mockReset()
  }

  describe('interface', () => {
    it('returns expected interface', () => {
      resetMocks()
      const result = useTagMutations()

      expect(result).toHaveProperty('createTag')
      expect(result).toHaveProperty('renameTag')
      expect(result).toHaveProperty('deleteTag')
    })
  })

  describe('createTag', () => {
    it('returns the created tag on success', async () => {
      resetMocks()
      const tag = makeTag()
      mockCreateTagApi.mockReturnValue(tag)

      const { createTag } = useTagMutations()
      const result = await createTag('work')

      expect(result).toEqual(tag)
    })

    it('calls the API with the database and name', async () => {
      resetMocks()
      const tag = makeTag()
      mockCreateTagApi.mockReturnValue(tag)

      const { createTag } = useTagMutations()
      await createTag('work')

      expect(mockCreateTagApi).toHaveBeenCalledWith(mockDatabase, {
        name: 'work'
      })
    })

    it('returns null on TagValidationError', async () => {
      resetMocks()
      mockCreateTagApi.mockImplementation(() => {
        throw new TagValidationError('Tag name must not be empty')
      })

      const { createTag } = useTagMutations()
      const result = await createTag('')

      expect(result).toBeNull()
    })

    it('shows error toast on TagValidationError', async () => {
      resetMocks()
      mockCreateTagApi.mockImplementation(() => {
        throw new TagValidationError('A tag named "work" already exists')
      })

      const { createTag } = useTagMutations()
      await createTag('work')

      expect(mockShowError).toHaveBeenCalledOnce()
    })

    it('shows error toast on unexpected DB error', async () => {
      resetMocks()
      mockCreateTagApi.mockImplementation(() => {
        throw new Error('DB connection failed')
      })

      const { createTag } = useTagMutations()
      const result = await createTag('work')

      expect(result).toBeNull()
      expect(mockShowError).toHaveBeenCalledOnce()
    })
  })

  describe('renameTag', () => {
    it('calls the API with the database, id, and name', async () => {
      resetMocks()
      mockRenameTagApi.mockReturnValue(makeTag({ name: 'personal' }))

      const { renameTag } = useTagMutations()
      await renameTag('tag-1', 'personal')

      expect(mockRenameTagApi).toHaveBeenCalledWith(
        mockDatabase,
        'tag-1',
        'personal'
      )
    })

    it('shows error toast on TagValidationError', async () => {
      resetMocks()
      mockRenameTagApi.mockImplementation(() => {
        throw new TagValidationError('Tag name must not be empty')
      })

      const { renameTag } = useTagMutations()
      await renameTag('tag-1', '')

      expect(mockShowError).toHaveBeenCalledOnce()
    })

    it('shows error toast on unexpected DB error', async () => {
      resetMocks()
      mockRenameTagApi.mockImplementation(() => {
        throw new Error('DB error')
      })

      const { renameTag } = useTagMutations()
      await renameTag('tag-1', 'personal')

      expect(mockShowError).toHaveBeenCalledOnce()
    })
  })

  describe('deleteTag', () => {
    it('calls softDeleteTag with database and id', async () => {
      resetMocks()
      mockSoftDeleteTagApi.mockReturnValue(undefined)

      const { deleteTag } = useTagMutations()
      await deleteTag('tag-1')

      expect(mockSoftDeleteTagApi).toHaveBeenCalledWith(mockDatabase, 'tag-1')
    })

    it('shows error toast on failure', async () => {
      resetMocks()
      mockSoftDeleteTagApi.mockImplementation(() => {
        throw new Error('DB error')
      })

      const { deleteTag } = useTagMutations()
      await deleteTag('tag-1')

      expect(mockShowError).toHaveBeenCalledOnce()
    })
  })
})
