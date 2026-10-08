/**
 * Validation Constants for Entry Forms
 *
 * Centralized validation rules used across entry create form and editor schemas.
 * Ensures consistency in validation behavior across different entry forms.
 */

import {
  ENTRY_CONTENT_MAX_LENGTH,
  ENTRY_VALIDATION_ERRORS
} from '@/shared/validation/validation-errors'

/**
 * Content validation constraints
 *
 * Used across create form and editor schemas to ensure consistent
 * content field validation.
 */
export const CONTENT_VALIDATION = {
  /** Minimum content length (1 character required) */
  MIN_LENGTH: 1,
  /** Maximum content length (10,000 characters) */
  MAX_LENGTH: ENTRY_CONTENT_MAX_LENGTH,
  messages: {
    required: ENTRY_VALIDATION_ERRORS.CONTENT_EMPTY,
    maxLength: ENTRY_VALIDATION_ERRORS.CONTENT_TOO_LONG
  }
} as const

/**
 * Date validation messages for assigned day field
 */
export const DATE_VALIDATION = {
  messages: {
    invalid: 'Must be a valid date (YYYY-MM-DD)'
  }
} as const
