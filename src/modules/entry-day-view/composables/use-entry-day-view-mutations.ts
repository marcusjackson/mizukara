import { createEntry, updateEntry } from '@/api/entries/entry-mutations'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

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
  /** Create a new entry; resolves true on success, false after showing an error toast */
  createNewEntry: (data: CreateEntryInput) => Promise<boolean>
  /** Update an existing entry; resolves true on success, false after showing an error toast */
  updateExistingEntry: (
    entryId: string,
    data: UpdateEntryInput
  ) => Promise<boolean>
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
  const { error: showError } = useToast()

  /**
   * Run a database write followed by the refetch, turning any failure into an
   * error toast so no caller has to catch it.
   */
  const runMutation = async (
    mutate: (db: NonNullable<typeof database.value>) => void,
    fallbackMessage: string
  ): Promise<boolean> => {
    try {
      if (!database.value) {
        throw new Error('Database not initialized')
      }
      mutate(database.value)
      await onRefetch()
      return true
    } catch (err) {
      showError(err instanceof Error ? err.message : fallbackMessage)
      return false
    }
  }

  /**
   * Create a new entry
   *
   * @param data - Entry creation data
   * @returns Whether the entry was created
   */
  const createNewEntry = (data: CreateEntryInput): Promise<boolean> =>
    runMutation((db) => {
      createEntry(db, data)
    }, 'Failed to create entry')

  /**
   * Update an existing entry
   *
   * @param entryId - ID of entry to update
   * @param data - Entry update data
   * @returns Whether the entry was updated
   */
  const updateExistingEntry = (
    entryId: string,
    data: UpdateEntryInput
  ): Promise<boolean> =>
    runMutation((db) => {
      updateEntry(db, entryId, data)
    }, 'Failed to update entry')

  return {
    createNewEntry,
    updateExistingEntry
  }
}
