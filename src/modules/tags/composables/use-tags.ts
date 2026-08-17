/**
 * use-tags
 *
 * Reactive tag data composable providing the full tag list with counts,
 * tag options for BaseTagInput, and filtered entries by tag selection.
 */

import { computed, ref } from 'vue'

import { findEntriesByTags } from '@/api/entry-tags/entry-tag-queries'
import { findAllWithCount } from '@/api/tags/tag-queries'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import type { Entry } from '@/shared/types/entry-types'
import type { TagInputOption, TagWithCount } from '@/shared/types/tag-types'
import type { ComputedRef, Ref } from 'vue'

// =============================================================================
// Types
// =============================================================================

export interface UseTagsReturn {
  /** All non-deleted tags with their non-deleted association counts */
  tags: Readonly<Ref<TagWithCount[]>>
  /** Computed mapping of tags to TagInputOption[] for BaseTagInput */
  tagOptions: ComputedRef<TagInputOption[]>
  /** Entries matching all currently selected tag IDs */
  filteredEntries: Readonly<Ref<Entry[]>>
  /** True while any async fetch is in progress */
  isLoading: Readonly<Ref<boolean>>
  /** Fetch all tags (including zero-count) from the database */
  fetchTags: () => Promise<void>
  /** Fetch entries matching all provided tag IDs; empty array clears filteredEntries */
  fetchEntriesByTags: (tagIds: string[]) => Promise<void>
}

// =============================================================================
// Composable
// =============================================================================

export function useTags(): UseTagsReturn {
  const { database } = useDatabase()
  const { error: showError } = useToast()

  const tags = ref<TagWithCount[]>([])
  const filteredEntries = ref<Entry[]>([])
  const isLoading = ref(false)

  const tagOptions = computed<TagInputOption[]>(() =>
    tags.value.map((tag) => ({ value: tag.id, label: tag.name }))
  )

  /**
   * Fetch all non-deleted tags with entry counts from the database.
   * Includes zero-count tags. Ordered by name ascending (API responsibility).
   */
  function fetchTags(): Promise<void> {
    if (!database.value) return Promise.resolve()

    isLoading.value = true

    try {
      tags.value = findAllWithCount(database.value)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tags'
      showError(message)
    } finally {
      isLoading.value = false
    }

    return Promise.resolve()
  }

  /**
   * Fetch entries matching ALL provided tag IDs (intersection semantics).
   * Passing an empty array clears filteredEntries without querying the DB.
   */
  function fetchEntriesByTags(tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) {
      filteredEntries.value = []
      return Promise.resolve()
    }

    if (!database.value) return Promise.resolve()

    try {
      filteredEntries.value = findEntriesByTags(database.value, tagIds)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load entries'
      showError(message)
    }

    return Promise.resolve()
  }

  return {
    fetchEntriesByTags,
    fetchTags,
    filteredEntries,
    isLoading,
    tagOptions,
    tags
  }
}
