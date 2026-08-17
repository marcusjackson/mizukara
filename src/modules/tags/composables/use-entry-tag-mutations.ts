/**
 * use-entry-tag-mutations
 *
 * Entry-tag association mutations with toast feedback.
 * Provides assignTag, removeTag, and createAndAssignTag operations.
 */

import {
  assignTag as assignTagApi,
  removeTag as removeTagApi
} from '@/api/entry-tags/entry-tag-mutations'
import { createTag as createTagApi } from '@/api/tags/tag-mutations'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import type { Tag } from '@/shared/types/tag-types'

// =============================================================================
// Types
// =============================================================================

export interface UseEntryTagMutationsReturn {
  /** Assign an existing tag to an entry (idempotent). Shows toast on error. */
  assignTag: (entryId: string, tagId: string) => Promise<void>
  /** Remove a tag association from an entry (soft-delete). Shows toast on error. */
  removeTag: (entryId: string, tagId: string) => Promise<void>
  /**
   * Create a new tag and immediately assign it to an entry.
   * Returns the created Tag or null on any failure (toast shown).
   * If tag creation fails, no orphan association is created.
   */
  createAndAssignTag: (entryId: string, name: string) => Promise<Tag | null>
}

// =============================================================================
// Composable
// =============================================================================

export function useEntryTagMutations(): UseEntryTagMutationsReturn {
  const { database } = useDatabase()
  const { error: showError } = useToast()

  function assignTag(entryId: string, tagId: string): Promise<void> {
    if (!database.value) return Promise.resolve()
    try {
      assignTagApi(database.value, { entryId, tagId })
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to assign tag')
    }
    return Promise.resolve()
  }

  function removeTag(entryId: string, tagId: string): Promise<void> {
    if (!database.value) return Promise.resolve()
    try {
      removeTagApi(database.value, entryId, tagId)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove tag')
    }
    return Promise.resolve()
  }

  function createAndAssignTag(
    entryId: string,
    name: string
  ): Promise<Tag | null> {
    if (!database.value) return Promise.resolve(null)
    let tag: Tag

    try {
      tag = createTagApi(database.value, { name })
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create tag')
      return Promise.resolve(null)
    }

    try {
      assignTagApi(database.value, { entryId, tagId: tag.id })
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to assign tag')
      return Promise.resolve(null)
    }

    return Promise.resolve(tag)
  }

  return {
    assignTag,
    createAndAssignTag,
    removeTag
  }
}
