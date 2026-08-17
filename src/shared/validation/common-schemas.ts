/**
 * Common Validation Schemas
 *
 * Shared zod schemas used across multiple modules.
 *
 * @module shared/validation
 */

import { z } from 'zod'

/**
 * Optional string with max length
 */
export function optionalString(maxLength: number): z.ZodOptional<z.ZodString> {
  return z
    .string()
    .max(maxLength, `Max ${String(maxLength)} characters`)
    .optional()
}
