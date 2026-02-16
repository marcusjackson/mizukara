/**
 * Validation Error Messages
 *
 * Centralized error messages for form and data validation.
 * Enables consistent messaging and future i18n support.
 */

/**
 * Entry validation error messages
 */
export const ENTRY_VALIDATION_ERRORS = {
  CONTENT_EMPTY: 'Please enter some content for your entry',
  CONTENT_TYPE: 'Content must be a string',
  DATE_FORMAT: 'Please enter a valid date in YYYY-MM-DD format'
} as const

/**
 * Date validation constraints
 */
export const DATE_VALIDATION_CONSTRAINTS = {
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
  MIN_DAY: 1,
  MAX_DAY: 31
} as const
