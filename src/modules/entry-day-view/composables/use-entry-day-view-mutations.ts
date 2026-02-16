import { createEntry, updateEntry } from '@/api/entries/entry-mutations'

import { useDatabase } from '@/shared/composables/use-database'

import type {
  CreateEntryInput,
  UpdateEntryInput
} from '@/shared/types/entry-types'

/**
 * Options for useEntryDayViewMutations composable
 */
export interface UseEntryDayViewMutationsOptions {
  /** Callback invoked after successful mutations to refetch data */
  onRefetch: () => Promise<void>
}

/**
 * Return type for useEntryDayViewMutations composable
 */
export interface UseEntryDayViewMutationsReturn {
  /** Create a new entry */
  createNewEntry: (data: CreateEntryInput) => Promise<void>
  /** Update an existing entry */
  updateExistingEntry: (
    entryId: string,
    data: UpdateEntryInput
  ) => Promise<void>
}

/**
 * Entry mutations composable for day view
 *
 * Provides centralized database mutation operations with automatic refetch.
 * Follows repository pattern - components should never access database directly.
 *
 * @param options - Configuration options including refetch callback
 * @returns Object with mutation functions
 *
 * @example
 * const { createNewEntry, updateExistingEntry } = useEntryDayViewMutations({
 *   onRefetch: () => fetchEntries()
 * })
 *
 * await createNewEntry({ content: 'New entry', assignedDay: '2026-02-13' })
 */
export function useEntryDayViewMutations(
  options: UseEntryDayViewMutationsOptions
): UseEntryDayViewMutationsReturn {
  const { onRefetch } = options
  const { database } = useDatabase()

  /**
   * Create a new entry
   *
   * @param data - Entry creation data
   * @throws {Error} If database is not initialized
   */
  const createNewEntry = async (data: CreateEntryInput): Promise<void> => {
    if (!database.value) {
      throw new Error('Database not initialized')
    }

    createEntry(database.value, data)
    await onRefetch()
  }

  /**
   * Update an existing entry
   *
   * @param entryId - ID of entry to update
   * @param data - Entry update data
   * @throws {Error} If database is not initialized
   */
  const updateExistingEntry = async (
    entryId: string,
    data: UpdateEntryInput
  ): Promise<void> => {
    if (!database.value) {
      throw new Error('Database not initialized')
    }

    updateEntry(database.value, entryId, data)
    await onRefetch()
  }

  return {
    createNewEntry,
    updateExistingEntry
  }
}
