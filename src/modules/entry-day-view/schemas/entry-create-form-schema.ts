/**
 * Entry Create Form Schema
 *
 * Zod validation schema for the entry create form.
 * Validates content field (required, max 10,000 chars).
 *
 * @example
 * ```typescript
 * // Direct validation
 * const result = entryCreateFormSchema.safeParse({
 *   content: 'Had a great day'
 * })
 *
 * if (result.success) {
 *   console.log(result.data.content)
 * }
 *
 * // With vee-validate
 * import { toTypedSchema } from '@vee-validate/zod'
 * const schema = toTypedSchema(entryCreateFormSchema)
 * const { meta } = useForm({ validationSchema: schema })
 * ```
 */

import { z } from 'zod'

import { CONTENT_VALIDATION } from './validation-constants'

export const entryCreateFormSchema = z.object({
  content: z
    .string()
    .min(CONTENT_VALIDATION.MIN_LENGTH, CONTENT_VALIDATION.messages.required)
    .max(CONTENT_VALIDATION.MAX_LENGTH, CONTENT_VALIDATION.messages.maxLength)
})

// Export inferred type
export type EntryCreateFormData = z.infer<typeof entryCreateFormSchema>
