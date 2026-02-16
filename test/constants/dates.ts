/**
 * Test Date Constants
 *
 * Centralized date values for consistent test data across test suites.
 */

/**
 * Standard test dates in ISO format (YYYY-MM-DD)
 */
export const TEST_DATES = {
  /** Default test date: January 1, 2022 */
  DEFAULT: '2022-01-01',
  /** Next day after default: January 2, 2022 */
  NEXT_DAY: '2022-01-02',
  /** Third test day: January 3, 2022 */
  THIRD_DAY: '2022-01-03',
  /** Previous day before default: December 31, 2021 */
  PREV_DAY: '2021-12-31'
} as const
