/**
 * Entry Day View Section Handlers
 *
 * Composable providing event handlers for EntryDayViewSectionList component.
 * Wraps mutations and reorder operations with toast notifications.
 */

import { useToast } from '@/shared/composables/use-toast'

import { useEntryDayViewMutations } from './use-entry-day-view-mutations'
import { useEntryReorder } from './use-entry-reorder'

import type { UseToast } from '@/shared/composables/use-toast'
import type { Entry } from '@/shared/types/entry-types'
import type { Ref } from 'vue'

export interface UseEntrySectionHandlersOptions {
  onRefetch: () => Promise<void>
}

/**
 * Return type for useEntrySectionHandlers composable
 */
export interface UseEntrySectionHandlersReturn {
  /** Check if entry can be moved down */
  canMoveDown: (entryId: string, entries: Entry[]) => boolean
  /** Check if entry can be moved up */
  canMoveUp: (entryId: string, entries: Entry[]) => boolean
  /** Handle new entry creation */
  handleEntryCreated: (data: {
    content: string
    assignedDay: string
  }) => Promise<boolean>
  /** Handle moving an entry down */
  handleMoveDown: (entryId: string, entries: Entry[]) => void
  /** Handle moving an entry up */
  handleMoveUp: (entryId: string, entries: Entry[]) => void
  /** Handle save request for existing entry */
  handleSaveRequested: (
    entryId: string,
    data: { content: string; assignedDay: string }
  ) => Promise<boolean>
  /** Whether a reorder operation is in progress */
  isReordering: Ref<boolean>
}

/**
 * Run a mutation and announce success; the mutation reports its own failure.
 *
 * @returns Whether the operation succeeded
 *
 * @param operation - Async mutation resolving to whether it succeeded
 * @param operationName - Name for the success message (e.g., 'created', 'updated')
 * @param toast - Toast service instance
 */
async function withSuccessToast(
  operation: () => Promise<boolean>,
  operationName: string,
  toast: UseToast
): Promise<boolean> {
  const succeeded = await operation()
  if (succeeded) toast.success(`Entry ${operationName} successfully`)
  return succeeded
}

/**
 * Section handlers composable for EntryDayViewSectionList.
 *
 * Wraps entry mutations and reorder operations with toast notifications.
 *
 * @param options - Configuration including refetch callback
 * @returns Event handlers for entry creation, save, and reordering
 */
export function useEntrySectionHandlers(
  options: UseEntrySectionHandlersOptions
): UseEntrySectionHandlersReturn {
  const toast = useToast()
  const { createNewEntry, updateExistingEntry } = useEntryDayViewMutations({
    onRefetch: options.onRefetch
  })
  const { canMoveDown, canMoveUp, isReordering, moveEntryDown, moveEntryUp } =
    useEntryReorder({
      onRefetch: options.onRefetch
    })

  const handleMoveUp = (entryId: string, entries: Entry[]) => {
    const result = moveEntryUp(entryId, entries)
    if (!result.success && result.reason === 'error')
      toast.error('Failed to reorder entry')
  }

  const handleMoveDown = (entryId: string, entries: Entry[]) => {
    const result = moveEntryDown(entryId, entries)
    if (!result.success && result.reason === 'error')
      toast.error('Failed to reorder entry')
  }

  return {
    canMoveDown,
    canMoveUp,
    handleEntryCreated: (data: { content: string; assignedDay: string }) =>
      withSuccessToast(() => createNewEntry(data), 'created', toast),
    handleMoveDown,
    handleMoveUp,
    handleSaveRequested: (
      entryId: string,
      data: { content: string; assignedDay: string }
    ) =>
      withSuccessToast(
        () => updateExistingEntry(entryId, data),
        'updated',
        toast
      ),
    isReordering
  }
}
