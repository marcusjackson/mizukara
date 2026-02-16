/**
 * E2E Test Data Constants
 *
 * Centralized test data for E2E tests.
 * Provides consistent, reusable test content across all test files.
 */

export const TEST_ENTRY_CONTENT = {
  SIMPLE: 'Test entry content',
  WALK: 'Went for a walk in the park today. Beautiful weather!',
  LONG: 'A longer test entry with more detailed information about the day',
  TODAY: 'Entry for today',
  YESTERDAY: 'Yesterday entry unique',
  TOMORROW: 'Tomorrow entry for testing',
  FIRST: 'First entry of the day',
  SECOND: 'Second entry with more details',
  THIRD: 'Third entry to test ordering',
  ORIGINAL: 'Original entry content before editing',
  UPDATED: 'This content has been EDITED and updated!',
  DISCARDED: 'This content should be discarded',
  TIMESTAMP_TEST: 'Testing timestamp display',
  ESCAPE_TEST: 'Content that should remain after Escape',
  REFERENCE: 'Reference entry for today'
} as const
