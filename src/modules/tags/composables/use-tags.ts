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
import type { Database } from 'sql.js'
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
  /** Message from the last failed tag fetch; null after a successful one */
  loadError: Readonly<Ref<string | null>>
  /** Fetch all tags (including zero-count) from the database */
  fetchTags: () => Promise<void>
  /** Fetch entries matching all provided tag IDs; empty array clears filteredEntries */
  fetchEntriesByTags: (tagIds: string[]) => Promise<void>
}

/**
 * Run a read with the loading flag raised; a failure shows a toast.
 *
 * @returns The failure message, or null when the read succeeded (or there was no database)
 */
function runRead(
  db: Database | null,
  isLoading: Ref<boolean>,
  showError: (message: string) => void,
  read: (db: Database) => void,
  fallbackMessage: string
): string | null {
  if (!db) return null
  isLoading.value = true
  try {
    read(db)
    return null
  } catch (err) {
    const message = err instanceof Error ? err.message : fallbackMessage
    showError(message)
    return message
  } finally {
    isLoading.value = false
  }
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
  const loadError = ref<string | null>(null)

  const tagOptions = computed<TagInputOption[]>(() =>
    tags.value.map((tag) => ({ value: tag.id, label: tag.name }))
  )

  /**
   * Fetch all non-deleted tags with entry counts from the database.
   * Includes zero-count tags. Ordered by name ascending (API responsibility).
   */
  function fetchTags(): Promise<void> {
    loadError.value = runRead(
      database.value,
      isLoading,
      showError,
      (db) => {
        tags.value = findAllWithCount(db)
      },
      'Failed to load tags'
    )
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
    runRead(
      database.value,
      isLoading,
      showError,
      (db) => {
        filteredEntries.value = findEntriesByTags(db, tagIds)
      },
      'Failed to load entries'
    )
    return Promise.resolve()
  }

  return {
    fetchEntriesByTags,
    fetchTags,
    filteredEntries,
    isLoading,
    loadError,
    tagOptions,
    tags
  }
}
