/**
 * Composable for fetching entries and entry-tag associations for a given day.
 *
 * Encapsulates all data-access logic for EntryDayViewRoot, resolving
 * the concern of the root component importing API functions directly.
 *
 * @param currentDate - Reactive ref with the ISO date string for the current day
 * @returns Reactive state and fetch functions for entries/tags
 */
import { ref } from 'vue'

import { findByDay } from '@/api/entries/entry-queries'
import { findByEntryIds } from '@/api/entry-tags/entry-tag-queries'

import { useDatabase } from '@/shared/composables/use-database'

import type { Entry } from '@/shared/types/entry-types'
import type { Tag } from '@/shared/types/tag-types'
import type { Ref } from 'vue'

export function useEntryDayViewQueries(currentDate: Ref<string>) {
  const { database: db } = useDatabase()

  const entries = ref<Entry[]>([])
  const entryTagsMap = ref<Map<string, Tag[]>>(new Map())
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  const fetchEntries = () => {
    const database = db.value
    if (!database) {
      error.value = new Error('Database not initialized')
      isLoading.value = false
      return
    }

    try {
      isLoading.value = true
      error.value = null
      entries.value = findByDay(database, currentDate.value)
      entryTagsMap.value = findByEntryIds(
        database,
        entries.value.map((e) => e.id)
      )
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      entries.value = []
    } finally {
      isLoading.value = false
    }
  }

  const refetchEntries = (): Promise<void> => {
    fetchEntries()
    return Promise.resolve()
  }

  return {
    entries,
    entryTagsMap,
    isLoading,
    error,
    fetchEntries,
    refetchEntries
  }
}
