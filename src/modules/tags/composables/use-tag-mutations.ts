/**
 * use-tag-mutations
 *
 * Tag lifecycle mutations with toast feedback.
 * Wraps createTag, renameTag, and softDeleteTag repository functions.
 */

import {
  createTag as createTagApi,
  renameTag as renameTagApi,
  softDeleteTag as softDeleteTagApi
} from '@/api/tags/tag-mutations'
import { TagValidationError } from '@/api/tags/tag-validation'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import type { Tag } from '@/shared/types/tag-types'

// =============================================================================
// Types
// =============================================================================

export interface UseTagMutationsReturn {
  /** Create a new tag. Returns the tag on success, null if validation fails (toast shown). */
  createTag: (name: string) => Promise<Tag | null>
  /** Rename an existing tag. Returns true on success, false on error (toast shown). */
  renameTag: (id: string, name: string) => Promise<boolean>
  /** Soft-delete a tag and cascade to its entry_tags associations. Returns true on success, false on error (toast shown). */
  deleteTag: (id: string) => Promise<boolean>
}

// =============================================================================
// Composable
// =============================================================================

export function useTagMutations(): UseTagMutationsReturn {
  const { database } = useDatabase()
  const { error: showError } = useToast()

  /**
   * Create a new tag by name.
   *
   * Delegates validation (non-empty, case-insensitive uniqueness) to the API.
   * Returns the created tag or null on any failure (Toast shown on error).
   */
  function createTag(name: string): Promise<Tag | null> {
    if (!database.value) return Promise.resolve(null)

    try {
      return Promise.resolve(createTagApi(database.value, { name }))
    } catch (err) {
      const message =
        err instanceof TagValidationError || err instanceof Error
          ? err.message
          : 'Failed to create tag'
      showError(message)
      return Promise.resolve(null)
    }
  }

  /**
   * Rename an existing tag.
   *
   * Shows toast on TagValidationError (duplicate/empty) or DB failure.
   * Returns true on success, false on error.
   */
  function renameTag(id: string, name: string): Promise<boolean> {
    if (!database.value) return Promise.resolve(false)

    try {
      renameTagApi(database.value, id, name)
      return Promise.resolve(true)
    } catch (err) {
      const message =
        err instanceof TagValidationError || err instanceof Error
          ? err.message
          : 'Failed to rename tag'
      showError(message)
      return Promise.resolve(false)
    }
  }

  /**
   * Soft-delete a tag and cascade to all its entry_tags associations.
   *
   * Calls softDeleteTag which internally triggers softDeleteByTagId.
   * Shows toast on any failure. Returns true on success, false on error.
   */
  function deleteTag(id: string): Promise<boolean> {
    if (!database.value) return Promise.resolve(false)

    try {
      softDeleteTagApi(database.value, id)
      return Promise.resolve(true)
    } catch (err) {
      const message =
        err instanceof TagValidationError || err instanceof Error
          ? err.message
          : 'Failed to delete tag'
      showError(message)
      return Promise.resolve(false)
    }
  }

  return {
    createTag,
    deleteTag,
    renameTag
  }
}
