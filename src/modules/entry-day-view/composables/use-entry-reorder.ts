import { ref } from 'vue'

import { updateOrderPosition } from '@/api/entries/entry-mutations'

import { useDatabase } from '@/shared/composables/use-database'
import { useToast } from '@/shared/composables/use-toast'

import type { Entry } from '@/shared/types/entry-types'
import type { Ref } from 'vue'

/**
 * Result of a successful reorder operation
 */
export interface ReorderSuccess {
  success: true
}

/**
 * Result of a failed reorder operation
 */
export type ReorderFailure =
  | { success: false; reason: 'in-progress' }
  | { success: false; reason: 'no-database' }
  | { success: false; reason: 'not-found' }
  | { success: false; reason: 'at-boundary' }
  | { success: false; reason: 'error'; error: Error }

/**
 * Result of a reorder operation
 */
export type ReorderResult = ReorderSuccess | ReorderFailure

/**
 * Options for useEntryReorder composable
 */
export interface UseEntryReorderOptions {
  /** Callback invoked after successful reorder operation */
  onRefetch: () => void | Promise<void>
}

/**
 * Return type for useEntryReorder composable
 */
export interface UseEntryReorderReturn {
  /** Move entry up by one position */
  moveEntryUp: (entryId: string, entries: Entry[]) => ReorderResult
  /** Move entry down by one position */
  moveEntryDown: (entryId: string, entries: Entry[]) => ReorderResult
  /** Check if entry can be moved up */
  canMoveUp: (entryId: string, entries: Entry[]) => boolean
  /** Check if entry can be moved down */
  canMoveDown: (entryId: string, entries: Entry[]) => boolean
  /** Whether a reorder operation is currently in progress */
  isReordering: Ref<boolean>
}

/**
 * Find the index of an entry in the entries array by ID
 */
function findEntryIndex(entryId: string, entries: Entry[]): number {
  return entries.findIndex((entry) => entry.id === entryId)
}

/**
 * Check if an entry can be moved up (not at index 0)
 *
 * @param entryId - ID of the entry to check
 * @param entries - Array of entries for the day
 * @returns True if entry can be moved up
 */
function canMoveUp(entryId: string, entries: Entry[]): boolean {
  const index = findEntryIndex(entryId, entries)
  return index > 0
}

/**
 * Check if an entry can be moved down (not at last index)
 *
 * @param entryId - ID of the entry to check
 * @param entries - Array of entries for the day
 * @returns True if entry can be moved down
 */
function canMoveDown(entryId: string, entries: Entry[]): boolean {
  const index = findEntryIndex(entryId, entries)
  return index >= 0 && index < entries.length - 1
}

/**
 * Entry reordering composable for managing entry order within a day
 *
 * Provides functions to move entries up/down within their assigned day,
 * with boundary checks and database persistence.
 *
 * @param options - Configuration options including refetch callback
 * @returns Object with reorder functions and boundary checks
 *
 * @example
 * const { moveEntryUp, moveEntryDown, canMoveUp, canMoveDown } = useEntryReorder({
 *   onRefetch: () => fetchEntries()
 * })
 */
// eslint-disable-next-line max-lines-per-function
export function useEntryReorder(
  options: UseEntryReorderOptions
): UseEntryReorderReturn {
  const { onRefetch } = options
  const db = useDatabase()
  const toast = useToast()
  const isReordering = ref(false)

  /**
   * Swap positions of two adjacent entries in the database
   *
   * @param entryId - ID of the entry to move
   * @param entries - Array of entries for the day
   * @param direction - Direction to move ('up' or 'down')
   * @returns Result object indicating success or failure reason
   */
  // eslint-disable-next-line max-lines-per-function
  function swapEntryPositions(
    entryId: string,
    entries: Entry[],
    direction: 'up' | 'down'
  ): ReorderResult {
    if (isReordering.value) {
      return { success: false, reason: 'in-progress' }
    }

    if (!db.database.value) {
      return { success: false, reason: 'no-database' }
    }

    const currentIndex = findEntryIndex(entryId, entries)
    if (currentIndex < 0) {
      return { success: false, reason: 'not-found' }
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Check boundaries
    if (targetIndex < 0 || targetIndex >= entries.length) {
      return { success: false, reason: 'at-boundary' }
    }

    const currentEntry = entries[currentIndex]
    const targetEntry = entries[targetIndex]

    if (!currentEntry || !targetEntry) {
      return { success: false, reason: 'not-found' }
    }

    isReordering.value = true

    try {
      // Swap positions
      updateOrderPosition(
        db.database.value,
        currentEntry.id,
        targetEntry.orderPosition
      )
      updateOrderPosition(
        db.database.value,
        targetEntry.id,
        currentEntry.orderPosition
      )

      // Notify parent to refetch
      const refetchResult = onRefetch()
      if (refetchResult instanceof Promise) {
        refetchResult.catch((err: unknown) => {
          toast.error('Failed to refresh entries after reordering')
          // Re-throw to prevent silent failures
          throw err
        })
      }
      return { success: true }
    } catch (error) {
      // Ensure UI reflects actual database state even on error
      const refetchResult = onRefetch()
      if (refetchResult instanceof Promise) {
        refetchResult.catch((err: unknown) => {
          toast.error('Failed to refresh entries after reorder error')
          // Re-throw to prevent silent failures
          throw err
        })
      }
      return {
        success: false,
        reason: 'error',
        error: error instanceof Error ? error : new Error(String(error))
      }
    } finally {
      isReordering.value = false
    }
  }

  /**
   * Move an entry up by swapping positions with the previous entry
   *
   * @param entryId - ID of the entry to move up
   * @param entries - Array of entries for the day
   * @returns Result object indicating success or failure reason
   */
  function moveEntryUp(entryId: string, entries: Entry[]): ReorderResult {
    return swapEntryPositions(entryId, entries, 'up')
  }

  /**
   * Move an entry down by swapping positions with the next entry
   *
   * @param entryId - ID of the entry to move down
   * @param entries - Array of entries for the day
   * @returns Result object indicating success or failure reason
   */
  function moveEntryDown(entryId: string, entries: Entry[]): ReorderResult {
    return swapEntryPositions(entryId, entries, 'down')
  }

  return {
    moveEntryUp,
    moveEntryDown,
    canMoveUp,
    canMoveDown,
    isReordering
  }
}
