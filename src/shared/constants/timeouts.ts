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
  FORM_SUBMIT_DEBOUNCE: 300,

  /**
   * How long a loaded local-inference model stays in memory unused (2 minutes)
   *
   * Measured from the moment the model becomes ready, and restarted after
   * every generation — it is an inactivity timer, not a lifetime. Two minutes
   * covers tagging a few entries in one sitting without paying the
   * multi-second load again each time, while returning several hundred
   * megabytes shortly after you stop. Longer raises the chance a backgrounded
   * app is killed by the operating system while still holding the model,
   * which costs more than a reload; shorter makes the second entry in a
   * sitting wait all over again.
   */
  INFERENCE_IDLE_TEARDOWN: 120000,

  /**
   * How long one embed may go unanswered before the worker is given up on
   * (30 seconds)
   *
   * An embed of a journal entry takes well under a second on the processor,
   * so this only ever fires on a worker that has stopped replying. Without it
   * that is a button that spins forever.
   */
  INFERENCE_EMBED: 30000
} as const
