/**
 * Entry Helper Functions
 *
 * Shared utility functions used across entry queries and mutations.
 * Contains pure transformation functions with no side effects.
 */

import type { Entry } from '@/shared/types/entry-types'

/**
 * Convert SQLite query result row to Entry object
 *
 * Maps database column order to Entry interface properties.
 * Converts is_deleted (0/1) to boolean.
 *
 * Expected column order:
 * 1. id (string)
 * 2. content (string)
 * 3. created_at (number - Unix timestamp)
 * 4. updated_at (number - Unix timestamp)
 * 5. assigned_day (string - ISO date YYYY-MM-DD)
 * 6. order_position (number)
 * 7. is_deleted (number - 0 or 1)
 *
 * @param row - Database row as array of values
 * @returns Entry object with typed properties
 *
 * @example
 * const row = ['uuid', 'content', 1234567890, 1234567890, '2026-02-11', 0, 0]
 * const entry = rowToEntry(row)
 * // { id: 'uuid', content: 'content', ..., isDeleted: false }
 */
export function rowToEntry(row: unknown[]): Entry {
  return {
    id: row[0] as string,
    content: row[1] as string,
    createdAt: row[2] as number,
    updatedAt: row[3] as number,
    assignedDay: row[4] as string,
    orderPosition: row[5] as number,
    isDeleted: !!row[6]
  }
}
