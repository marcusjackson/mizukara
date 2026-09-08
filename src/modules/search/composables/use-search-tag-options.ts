/**
 * use-search-tag-options
 *
 * Fetches the full tag list for the search filter's tag combobox. Reads
 * from the shared tags API directly (not the tags module's own use-tags
 * composable) — module isolation forbids importing across feature modules,
 * and this only needs the read-only tag list, not tag mutations.
 */

import { computed, ref } from 'vue'

import { findAllWithCount } from '@/api/tags/tag-queries'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import type { TagInputOption, TagWithCount } from '@/shared/types/tag-types'
import type { ComputedRef } from 'vue'

// =============================================================================
// Types
// =============================================================================

export interface UseSearchTagOptionsReturn {
  /** Tag options for BaseTagInput */
  tagOptions: ComputedRef<TagInputOption[]>
  /** Fetch all non-deleted tags from the database */
  fetchTagOptions: () => Promise<void>
}

// =============================================================================
// Composable
// =============================================================================

export function useSearchTagOptions(): UseSearchTagOptionsReturn {
  const { database } = useDatabase()
  const { error: showError } = useToast()

  const tags = ref<TagWithCount[]>([])

  const tagOptions = computed<TagInputOption[]>(() =>
    tags.value.map((tag) => ({ value: tag.id, label: tag.name }))
  )

  function fetchTagOptions(): Promise<void> {
    if (!database.value) return Promise.resolve()

    try {
      tags.value = findAllWithCount(database.value)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tags'
      showError(message)
    }

    return Promise.resolve()
  }

  return {
    fetchTagOptions,
    tagOptions
  }
}
