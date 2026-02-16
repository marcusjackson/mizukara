/**
 * Timeout and Debounce Duration Constants
 *
 * Centralized timing values for consistent UX across the application.
 * All values are in milliseconds.
 */

/**
 * Timeout duration constants
 *
 * Defines standard timeout and debounce durations used throughout the app.
 */
export const TIMEOUTS = {
  /** Toast notification auto-dismiss duration (2 seconds) */
  TOAST_DURATION: 2000,

  /** Default debounce delay for user input (150ms) */
  DEBOUNCE_DEFAULT: 150,

  /** Navigation debounce to prevent rapid clicking (150ms) */
  NAVIGATION_DEBOUNCE: 150,

  /** Form submission debounce (300ms) */
  FORM_SUBMIT_DEBOUNCE: 300
} as const
