/**
 * Validation Constants for Entry Forms
 *
 * Centralized validation rules used across entry create form and editor schemas.
 * Ensures consistency in validation behavior across different entry forms.
 */

import { ENTRY_VALIDATION_ERRORS } from '@/shared/validation/validation-errors'

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
  MAX_LENGTH: 10000,
  messages: {
    required: ENTRY_VALIDATION_ERRORS.CONTENT_EMPTY,
    maxLength: 'Must be no more than 10000 characters'
  }
} as const

/**
 * Date validation pattern for assigned day field
 *
 * Validates ISO 8601 date format (YYYY-MM-DD) used throughout the application.
 */
export const DATE_VALIDATION = {
  /** RegEx pattern for ISO 8601 date format (YYYY-MM-DD) */
  PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  messages: {
    invalid: 'Must be a valid date (YYYY-MM-DD)'
  }
} as const
