/**
 * Entry Editor Form Schema
 *
 * Zod validation schema for the entry editor form.
 * Validates content and assigned day fields.
 *
 * @example
 * ```typescript
 * // Direct validation
 * const result = entryEditorSchema.safeParse({
 *   content: 'Updated content',
 *   assignedDay: '2026-02-11'
 * })
 *
 * if (result.success) {
 *   console.log(result.data)
 * }
 *
 * // With vee-validate
 * import { toTypedSchema } from '@vee-validate/zod'
 * import { useForm } from 'vee-validate'
 *
 * const schema = toTypedSchema(entryEditorSchema)
 * const { handleSubmit } = useForm({ validationSchema: schema })
 * ```
 */

import { z } from 'zod'

import { isValidISODate } from '@/shared/utils/date-utils'

import { CONTENT_VALIDATION, DATE_VALIDATION } from './validation-constants'

export const entryEditorSchema = z.object({
  content: z
    .string()
    .min(CONTENT_VALIDATION.MIN_LENGTH, CONTENT_VALIDATION.messages.required)
    .max(CONTENT_VALIDATION.MAX_LENGTH, CONTENT_VALIDATION.messages.maxLength),

  assignedDay: z
    .string()
    .refine(
      (dateStr) => isValidISODate(dateStr),
      DATE_VALIDATION.messages.invalid
    )
})

// Export inferred type
export type EntryEditorFormData = z.infer<typeof entryEditorSchema>
