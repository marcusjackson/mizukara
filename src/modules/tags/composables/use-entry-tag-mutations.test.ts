/**
 * Tests for use-entry-tag-mutations composable
 *
 * Entry-tag association mutations with toast feedback:
 * assignTag, removeTag, createAndAssignTag.
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

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({
    error: mockShowError
  })
}))

const { mockAssignTagApi, mockCreateTagApi, mockRemoveTagApi } = vi.hoisted(
  () => ({
    mockAssignTagApi: vi.fn(),
    mockCreateTagApi: vi.fn(),
    mockRemoveTagApi: vi.fn()
  })
)

vi.mock('@/api/entry-tags/entry-tag-mutations', () => ({
  assignTag: mockAssignTagApi,
  removeTag: mockRemoveTagApi,
  softDeleteByTagId: vi.fn()
}))

vi.mock('@/api/tags/tag-mutations', () => ({
  createTag: mockCreateTagApi,
  renameTag: vi.fn(),
  softDeleteTag: vi.fn()
}))

// Import after mocks
import { useEntryTagMutations } from './use-entry-tag-mutations'

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

function makeEntryTag() {
  return {
    id: 'et-1',
    entryId: 'entry-1',
    tagId: 'tag-1',
    createdAt: 1000,
    updatedAt: 1000,
    isDeleted: false
  }
}

// =============================================================================
// Tests
// =============================================================================

function resetMocks() {
  mockAssignTagApi.mockReset()
  mockRemoveTagApi.mockReset()
  mockCreateTagApi.mockReset()
  mockShowError.mockReset()
}

describe('useEntryTagMutations', () => {
  describe('interface', () => {
    it('returns expected interface', () => {
      resetMocks()
      const result = useEntryTagMutations()

      expect(result).toHaveProperty('assignTag')
      expect(result).toHaveProperty('removeTag')
      expect(result).toHaveProperty('createAndAssignTag')
    })
  })

  describe('assignTag', () => {
    it('calls assignTag API with database, entryId, and tagId', async () => {
      resetMocks()
      mockAssignTagApi.mockReturnValue(makeEntryTag())

      const { assignTag } = useEntryTagMutations()
      await assignTag('entry-1', 'tag-1')

      expect(mockAssignTagApi).toHaveBeenCalledWith(mockDatabase, {
        entryId: 'entry-1',
        tagId: 'tag-1'
      })
    })

    it('shows error toast on API failure', async () => {
      resetMocks()
      mockAssignTagApi.mockImplementation(() => {
        throw new Error('DB error')
      })

      const { assignTag } = useEntryTagMutations()
      await assignTag('entry-1', 'tag-1')

      expect(mockShowError).toHaveBeenCalledOnce()
    })
  })

  describe('removeTag', () => {
    it('calls removeTag API with database, entryId, and tagId', async () => {
      resetMocks()
      mockRemoveTagApi.mockReturnValue(undefined)

      const { removeTag } = useEntryTagMutations()
      await removeTag('entry-1', 'tag-1')

      expect(mockRemoveTagApi).toHaveBeenCalledWith(
        mockDatabase,
        'entry-1',
        'tag-1'
      )
    })

    it('shows error toast on API failure', async () => {
      resetMocks()
      mockRemoveTagApi.mockImplementation(() => {
        throw new Error('DB error')
      })

      const { removeTag } = useEntryTagMutations()
      await removeTag('entry-1', 'tag-1')

      expect(mockShowError).toHaveBeenCalledOnce()
    })
  })

  describe('createAndAssignTag', () => {
    it('creates tag and assigns it to the entry', async () => {
      resetMocks()
      const tag = makeTag()
      mockCreateTagApi.mockReturnValue(tag)
      mockAssignTagApi.mockReturnValue(makeEntryTag())

      const { createAndAssignTag } = useEntryTagMutations()
      const result = await createAndAssignTag('entry-1', 'work')

      expect(mockCreateTagApi).toHaveBeenCalledWith(mockDatabase, {
        name: 'work'
      })
      expect(mockAssignTagApi).toHaveBeenCalledWith(mockDatabase, {
        entryId: 'entry-1',
        tagId: tag.id
      })
      expect(result).toEqual(tag)
    })

    it('returns the created tag on success', async () => {
      resetMocks()
      const tag = makeTag({ id: 'new-tag', name: 'ideas' })
      mockCreateTagApi.mockReturnValue(tag)
      mockAssignTagApi.mockReturnValue(makeEntryTag())

      const { createAndAssignTag } = useEntryTagMutations()
      const result = await createAndAssignTag('entry-1', 'ideas')

      expect(result).toEqual(tag)
    })

    it('returns null and shows toast when createTag fails with TagValidationError', async () => {
      resetMocks()
      mockCreateTagApi.mockImplementation(() => {
        throw new TagValidationError('Tag name must not be empty')
      })

      const { createAndAssignTag } = useEntryTagMutations()
      const result = await createAndAssignTag('entry-1', '')

      expect(result).toBeNull()
      expect(mockShowError).toHaveBeenCalledOnce()
    })

    it('does not call assignTag if createTag fails (no orphan association)', async () => {
      resetMocks()
      mockCreateTagApi.mockImplementation(() => {
        throw new TagValidationError('A tag named "work" already exists')
      })

      const { createAndAssignTag } = useEntryTagMutations()
      await createAndAssignTag('entry-1', 'work')

      expect(mockAssignTagApi).not.toHaveBeenCalled()
    })

    it('returns null and shows toast when assignTag fails', async () => {
      resetMocks()
      const tag = makeTag()
      mockCreateTagApi.mockReturnValue(tag)
      mockAssignTagApi.mockImplementation(() => {
        throw new Error('DB error during assign')
      })

      const { createAndAssignTag } = useEntryTagMutations()
      const result = await createAndAssignTag('entry-1', 'work')

      expect(result).toBeNull()
      expect(mockShowError).toHaveBeenCalledOnce()
    })
  })
})
