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

export interface UseEntrySectionHandlersOptions {
  onRefetch: () => Promise<void>
}

/**
 * Wrap async operation with toast notifications
 *
 * @param operation - Async function to execute
 * @param operationName - Name for success/error messages (e.g., 'created', 'updated')
 * @param toast - Toast service instance
 */
async function withToast<T>(
  operation: () => Promise<T>,
  operationName: string,
  toast: UseToast
): Promise<T | undefined> {
  try {
    const result = await operation()
    toast.success(`Entry ${operationName} successfully`)
    return result
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : `Failed to ${operationName} entry`
    )
    return undefined
  }
}

export function useEntrySectionHandlers(
  options: UseEntrySectionHandlersOptions
) {
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
      withToast(() => createNewEntry(data), 'created', toast),
    handleMoveDown,
    handleMoveUp,
    handleSaveRequested: (
      entryId: string,
      data: { content: string; assignedDay: string }
    ) => withToast(() => updateExistingEntry(entryId, data), 'updated', toast),
    isReordering
  }
}
