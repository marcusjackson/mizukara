/**
 * Validation Error Messages
 *
 * Centralized error messages for form and data validation.
 * Enables consistent messaging and future i18n support.
 */

/** Maximum entry content length, enforced by the form schemas and the API boundary */
export const ENTRY_CONTENT_MAX_LENGTH = 10000;

/**
 * Entry validation error messages
 */
export const ENTRY_VALIDATION_ERRORS = {
  CONTENT_EMPTY: 'Please enter some content for your entry',
  CONTENT_TYPE: 'Content must be a string',
  CONTENT_TOO_LONG: `Must be no more than ${String(ENTRY_CONTENT_MAX_LENGTH)} characters`,
  DATE_FORMAT: 'Please enter a valid date in YYYY-MM-DD format',
} as const;

/**
 * Date validation constraints
 */
export const DATE_VALIDATION_CONSTRAINTS = {
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
} as const;
