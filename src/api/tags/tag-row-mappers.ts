/**
 * Tag Row Mapper Functions
 *
 * Shared utility functions for mapping SQLite result rows to Tag objects.
 * Single source of truth for column-order-to-property mapping.
 */

import type { Tag } from '@/shared/types/tag-types'

/**
 * Convert SQLite query result row to Tag object
 *
 * Maps database column order to Tag interface properties.
 * Converts is_deleted (0/1) to boolean.
 *
 * Expected column order:
 * 1. id (string)
 * 2. name (string)
 * 3. created_at (number - Unix timestamp)
 * 4. updated_at (number - Unix timestamp)
 * 5. is_deleted (number - 0 or 1)
 *
 * @param row - Database row as array of values
 * @returns Tag object with typed properties
 *
 * @example
 * const row = ['uuid', 'work', 1234567890, 1234567890, 0]
 * const tag = rowToTag(row)
 * // { id: 'uuid', name: 'work', ..., isDeleted: false }
 */
export function rowToTag(row: unknown[]): Tag {
  return {
    id: row[0] as string,
    name: row[1] as string,
    createdAt: row[2] as number,
    updatedAt: row[3] as number,
    isDeleted: Boolean(row[4])
  }
}
