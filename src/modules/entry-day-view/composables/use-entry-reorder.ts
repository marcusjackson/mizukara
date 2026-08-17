import { ref } from 'vue'

import { updateOrderPosition } from '@/api/entries/entry-mutations'

import { useDatabase } from '@/shared/composables/use-database'

import type { UseDatabase } from '@/shared/composables/use-database'
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
 * Schedule a fire-and-forget refetch after an operation.
 * Errors during refetch are silently ignored — the DB operation
 * already succeeded; the next navigation will reload fresh data.
 */
function scheduleRefetch(onRefetch: () => void | Promise<void>): void {
  const result = onRefetch()
  if (result instanceof Promise) {
    result.catch(() => {
      // Intentionally silent — refetch failure is non-critical
    })
  }
}

/**
 * Dependencies required by swapEntryPositions
 */
interface SwapContext {
  database: UseDatabase['database']
  isReordering: Ref<boolean>
  onRefetch: () => void | Promise<void>
}

/**
 * Validated swap inputs with resolved entry references
 */
interface ValidSwapInputs {
  database: NonNullable<SwapContext['database']['value']>
  currentEntry: Entry
  targetEntry: Entry
}

/**
 * Validate all pre-conditions for a swap operation.
 * Returns either a failure reason or the resolved entries/database.
 */
function validateSwapInputs(
  entryId: string,
  entries: Entry[],
  direction: 'up' | 'down',
  ctx: SwapContext
): ReorderFailure | ValidSwapInputs {
  if (ctx.isReordering.value) return { success: false, reason: 'in-progress' }
  if (!ctx.database.value) return { success: false, reason: 'no-database' }
  const currentIndex = findEntryIndex(entryId, entries)
  if (currentIndex < 0) return { success: false, reason: 'not-found' }
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= entries.length) {
    return { success: false, reason: 'at-boundary' }
  }
  const currentEntry = entries[currentIndex]
  const targetEntry = entries[targetIndex]
  if (!currentEntry || !targetEntry)
    return { success: false, reason: 'not-found' }
  return { database: ctx.database.value, currentEntry, targetEntry }
}

/**
 * Swap positions of two adjacent entries in the database
 *
 * @param entryId - ID of the entry to move
 * @param entries - Array of entries for the day
 * @param direction - Direction to move ('up' or 'down')
 * @param ctx - Reactive state and callbacks from the composable
 * @returns Result object indicating success or failure reason
 */
function swapEntryPositions(
  entryId: string,
  entries: Entry[],
  direction: 'up' | 'down',
  ctx: SwapContext
): ReorderResult {
  const validated = validateSwapInputs(entryId, entries, direction, ctx)
  if ('reason' in validated) return validated
  const { currentEntry, database, targetEntry } = validated
  ctx.isReordering.value = true
  try {
    updateOrderPosition(database, currentEntry.id, targetEntry.orderPosition)
    updateOrderPosition(database, targetEntry.id, currentEntry.orderPosition)
    scheduleRefetch(ctx.onRefetch)
    return { success: true }
  } catch (error) {
    scheduleRefetch(ctx.onRefetch)
    return {
      success: false,
      reason: 'error',
      error: error instanceof Error ? error : new Error(String(error))
    }
  } finally {
    ctx.isReordering.value = false
  }
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
export function useEntryReorder(
  options: UseEntryReorderOptions
): UseEntryReorderReturn {
  const { onRefetch } = options
  const db = useDatabase()
  const isReordering = ref(false)
  const ctx: SwapContext = {
    database: db.database,
    isReordering,
    onRefetch
  }

  function moveEntryUp(entryId: string, entries: Entry[]): ReorderResult {
    return swapEntryPositions(entryId, entries, 'up', ctx)
  }

  function moveEntryDown(entryId: string, entries: Entry[]): ReorderResult {
    return swapEntryPositions(entryId, entries, 'down', ctx)
  }

  return { moveEntryUp, moveEntryDown, canMoveUp, canMoveDown, isReordering }
}
