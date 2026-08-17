/**
 * Entry Validation Schemas
 *
 * Domain-specific zod schemas for entry validation.
 *
 * @module shared/validation
 */

import { z } from 'zod'

/**
 * Validates a single Japanese character (handles Unicode properly)
 * Uses Intl.Segmenter for accurate grapheme counting.
 */
export const singleCharacterSchema = z
  .string()
  .min(1, 'Please enter a character')
  .refine(
    (val) => {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' })
      return [...segmenter.segment(val.trim())].length === 1
    },
    { message: 'Please enter only one character' }
  )
