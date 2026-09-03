import { watch } from 'vue'

import { toTypedSchema } from '@vee-validate/zod'
import { useField, useForm } from 'vee-validate'

import {
  type EntryEditorFormData,
  entryEditorSchema
} from '../schemas/entry-editor-schema'

import type { Entry } from '@/shared/types/entry-types'
import type { FormMeta } from 'vee-validate'
import type { ComputedRef, Ref } from 'vue'

/**
 * Return type for useEntryEditor composable
 */
export interface UseEntryEditorReturn {
  /** Content field error message */
  contentError: Ref<string | undefined>
  /** Content field value */
  contentValue: Ref<string>
  /** Assigned day field error message */
  assignedDayError: Ref<string | undefined>
  /** Assigned day field value */
  assignedDayValue: Ref<string>
  /** Form metadata for dirty/valid state */
  meta: ComputedRef<FormMeta<EntryEditorFormData>>
  /** Handle browser beforeunload event to warn about unsaved changes */
  handleBeforeUnload: (event: BeforeUnloadEvent) => void
  /** Handle global document keyboard events (Escape to cancel, Cmd+S to save) */
  handleKeyDown: (event: KeyboardEvent) => void
  /** Update the assigned day value programmatically */
  updateAssignedDay: (value: string) => void
}

/**
 * Composable for entry editor form logic
 *
 * Handles form state, validation, and unsaved changes tracking
 * for the entry editor component. Integrates with vee-validate
 * and zod for type-safe form validation.
 *
 * @param entry - The entry being edited, used to initialize form values
 * @param onCancel - Optional callback function called when editing is cancelled via Escape key
 * @param onSave - Optional callback function called when Cmd+S / Ctrl+S is pressed
 * @returns Object containing form fields, validation state, and event handlers
 *
 * @example
 * ```typescript
 * const { contentValue, contentError, handleKeyDown } = useEntryEditor(entry, () => {
 *   console.log('Editing cancelled')
 * })
 * ```
 */
export function useEntryEditor(
  entry: Entry,
  onCancel?: () => void,
  onSave?: () => void
): UseEntryEditorReturn {
  // Form setup
  const schema = toTypedSchema(entryEditorSchema)

  const { handleSubmit, meta, setFieldValue } = useForm<EntryEditorFormData>({
    validationSchema: schema,
    initialValues: { content: entry.content, assignedDay: entry.assignedDay }
  })

  // Field setup
  const { errorMessage: contentError, value: contentValue } =
    useField<string>('content')
  const { errorMessage: assignedDayError, value: assignedDayValue } =
    useField<string>('assignedDay')

  // Watch for prop changes to update form
  watch(
    () => entry,
    (newEntry) => {
      setFieldValue('content', newEntry.content)
      setFieldValue('assignedDay', newEntry.assignedDay)
    }
  )

  const validatedSave = handleSubmit(() => {
    onSave?.()
  })

  const { handleBeforeUnload, handleKeyDown } = createEditorEventHandlers(
    meta,
    validatedSave,
    onCancel
  )

  /**
   * The date input is bound explicitly (`:value` + `@input`/`@change`) rather than with `v-model`.
   * `v-model` on `<input type="date">` does not reliably sync into vee-validate's form state when
   * the value is set programmatically rather than typed — Playwright's `fill()` dispatches `input`
   * and `change`, and the form still submitted the previous value. Calling `setFieldValue` directly
   * is what makes the update deterministic. Reverting to `v-model` here reintroduces a silent
   * stale-value bug that only the e2e suite catches.
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

function createEditorEventHandlers(
  meta: ComputedRef<FormMeta<EntryEditorFormData>>,
  validatedSave: (e?: Event) => Promise<void>,
  onCancel?: () => void
): Pick<UseEntryEditorReturn, 'handleBeforeUnload' | 'handleKeyDown'> {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (meta.value.dirty) {
      event.preventDefault()
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onCancel?.()
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault()
      event.stopPropagation()
      void validatedSave()
    }
  }

  return { handleBeforeUnload, handleKeyDown }
}
