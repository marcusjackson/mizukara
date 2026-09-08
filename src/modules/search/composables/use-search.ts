/**
 * use-search
 *
 * Reactive search-results composable. Calls the search() query function
 * with the given filters and exposes the resulting entries.
 */

import { ref } from 'vue'

import { findDayCounts, search } from '@/api/search'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import type { DayCount, SearchFilters } from '@/api/search'
import type { Entry } from '@/shared/types/entry-types'
import type { Ref } from 'vue'

// =============================================================================
// Types
// =============================================================================

export interface UseSearchReturn {
  /** Entries matching the most recent search */
  entries: Readonly<Ref<Entry[]>>
  /** Per-day match counts for the calendar view's currently viewed month */
  dayCounts: Readonly<Ref<DayCount[]>>
  /** True while a list-view search is in progress */
  isLoading: Readonly<Ref<boolean>>
  /** True while a calendar-view day-count query is in progress */
  isLoadingDayCounts: Readonly<Ref<boolean>>
  /** Run a search with the given filters; capped selects the result-count cap */
  runSearch: (filters: SearchFilters, capped: boolean) => Promise<void>
  /** Run a day-count query for the given filters, scoped to a YYYY-MM month */
  runDayCounts: (filters: SearchFilters, month: string) => Promise<void>
}

// =============================================================================
// Composable
// =============================================================================

export function useSearch(): UseSearchReturn {
  const { database } = useDatabase()
  const { error: showError } = useToast()

  const entries = ref<Entry[]>([])
  const dayCounts = ref<DayCount[]>([])
  const isLoading = ref(false)
  const isLoadingDayCounts = ref(false)

  /**
   * Run a combined text/tag search and populate entries with the results.
   * Neither filter present returns [] without querying (search()'s own
   * short-circuit), matching the "nothing to show before first submit" default.
   */
  function runSearch(filters: SearchFilters, capped: boolean): Promise<void> {
    if (!database.value) return Promise.resolve()

    isLoading.value = true

    try {
      entries.value = search(database.value, filters, { capped })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      showError(message)
    } finally {
      isLoading.value = false
    }

    return Promise.resolve()
  }

  /**
   * Run a day-count query for the calendar view and populate dayCounts.
   * Unlike runSearch, neither filter present is meaningful here — it returns
   * the month's unfiltered per-day counts (findDayCounts's own default).
   */
  function runDayCounts(filters: SearchFilters, month: string): Promise<void> {
    if (!database.value) return Promise.resolve()

    isLoadingDayCounts.value = true

    try {
      dayCounts.value = findDayCounts(database.value, filters, month)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      showError(message)
    } finally {
      isLoadingDayCounts.value = false
    }

    return Promise.resolve()
  }

  return {
    entries,
    dayCounts,
    isLoading,
    isLoadingDayCounts,
    runSearch,
    runDayCounts
  }
}
