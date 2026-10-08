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
  REFERENCE: 'Reference entry for today',
  TAG_CREATION: 'Entry for tag creation test',
  TAG_REMOVAL: 'Entry to remove tag from E2E',
  TAG_FILTER_ALPHA: 'FilterEntry1 E2E (alpha only)',
  TAG_FILTER_ALPHA_BETA: 'FilterEntry2 E2E (alpha and beta)',
  TAG_RENAME: 'Entry for rename test E2E',
  TAG_DELETE: 'Entry for delete test E2E',
  TAG_KEYBOARD_RENAME: 'Entry for keyboard rename T9',
  TAG_ZERO_COUNT: 'Entry for zero-count tag T10'
} as const
