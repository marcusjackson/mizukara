/**
 * Composable for entry editor form logic
 *
 * Handles form state, validation, and unsaved changes tracking
 * for the entry editor component. Integrates with vee-validate
 * and zod for type-safe form validation.
 *
 * @param entry - The entry being edited, used to initialize form values
 * @param onCancel - Optional callback function called when editing is cancelled via Escape key
 * @returns Object containing form fields, validation state, and event handlers
 *
 * @example
 * ```typescript
 * const { contentValue, contentError, handleKeyDown } = useEntryEditor(entry, () => {
 *   console.log('Editing cancelled')
 * })
 * ```
 */
import { watch } from 'vue'

import { toTypedSchema } from '@vee-validate/zod'
import { useField, useForm } from 'vee-validate'

import {
  type EntryEditorFormData,
  entryEditorSchema
} from '../schemas/entry-editor-schema'

import type { Entry } from '@/shared/types/entry-types'

export function useEntryEditor(entry: Entry, onCancel?: () => void) {
  // Form setup
  const schema = toTypedSchema(entryEditorSchema)

  const { meta, setFieldValue } = useForm<EntryEditorFormData>({
    validationSchema: schema
  })

  // Field setup
  const { errorMessage: contentError, value: contentValue } =
    useField<string>('content')
  const { errorMessage: assignedDayError, value: assignedDayValue } =
    useField<string>('assignedDay')

  // Set initial values
  setFieldValue('content', entry.content)
  setFieldValue('assignedDay', entry.assignedDay)

  // Watch for prop changes to update form
  watch(
    () => entry,
    (newEntry) => {
      setFieldValue('content', newEntry.content)
      setFieldValue('assignedDay', newEntry.assignedDay)
    },
    { immediate: true }
  )

  // Handle beforeunload
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (meta.value.dirty) {
      event.preventDefault()
    }
  }

  // Handle Escape key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onCancel?.()
    }
  }

  /**
   * Update assigned day value via setFieldValue
   *
   * Uses vee-validate's setFieldValue API directly to ensure
   * programmatic updates (e.g., from Playwright fill()) are
   * properly detected by the form state.
   */
  const updateAssignedDay = (value: string) => {
    setFieldValue('assignedDay', value)
  }

  return {
    contentError,
    contentValue,
    assignedDayError,
    assignedDayValue,
    meta,
    handleBeforeUnload,
    handleKeyDown,
    updateAssignedDay
  }
}
