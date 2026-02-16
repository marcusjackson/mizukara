/**
 * Entry Validation Functions
 *
 * Validation logic for entry mutation operations.
 */

import { isValidISODate } from '@/shared/utils/date-utils'
import { ENTRY_VALIDATION_ERRORS } from '@/shared/validation/validation-errors'

/**
 * Custom error for entry validation failures
 *
 * Thrown when entry data fails validation constraints.
 * Includes the field name for targeted error display.
 */
export class EntryValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(`${field}: ${message}`)
    this.name = 'EntryValidationError'
  }
}

/**
 * Validate entry input data
 *
 * Ensures content is non-empty string and assignedDay is valid YYYY-MM-DD format.
 * Used by both createEntry and updateEntry mutations.
 *
 * @param input - Partial entry data to validate
 * @throws {EntryValidationError} If content is empty or date format is invalid
 * @throws {TypeError} If content is not a string
 *
 * @example
 * // Valid input passes silently
 * validateEntryInput({ content: 'Had a great day', assignedDay: '2026-02-11' })
 *
 * @example
 * // Invalid input throws
 * validateEntryInput({ content: '', assignedDay: '2026-02-11' })
 * // throws EntryValidationError: content: Please enter some content for your entry
 *
 * @example
 * // Invalid date throws
 * validateEntryInput({ content: 'Valid', assignedDay: '2026-13-01' })
 * // throws EntryValidationError: assignedDay: Please enter a valid date in YYYY-MM-DD format
 */
export function validateEntryInput(input: {
  content?: string
  assignedDay?: string
}): void {
  if (input.content !== undefined) {
    if (typeof input.content !== 'string') {
      throw new TypeError(ENTRY_VALIDATION_ERRORS.CONTENT_TYPE)
    }
    if (input.content.trim().length === 0) {
      throw new EntryValidationError(
        'content',
        ENTRY_VALIDATION_ERRORS.CONTENT_EMPTY
      )
    }
  }

  if (input.assignedDay !== undefined) {
    if (!isValidISODate(input.assignedDay)) {
      throw new EntryValidationError(
        'assignedDay',
        ENTRY_VALIDATION_ERRORS.DATE_FORMAT
      )
    }
  }
}
