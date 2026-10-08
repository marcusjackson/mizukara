/**
 * Tag Row Mapper Functions
 *
 * Shared utility functions for mapping SQLite result rows to Tag objects.
 * Single source of truth for column-order-to-property mapping.
 */

import { assertNumber, assertString } from '@/api/row-assertions'

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
 * @throws {TypeError} If a cell is not the type its column should hold
 *
 * @example
 * const row = ['uuid', 'work', 1234567890, 1234567890, 0]
 * const tag = rowToTag(row)
 * // { id: 'uuid', name: 'work', ..., isDeleted: false }
 */
export function rowToTag(row: unknown[]): Tag {
  return {
    id: assertString(row[0], 'id', 'rowToTag'),
    name: assertString(row[1], 'name', 'rowToTag'),
    createdAt: assertNumber(row[2], 'created_at', 'rowToTag'),
    updatedAt: assertNumber(row[3], 'updated_at', 'rowToTag'),
    isDeleted: Boolean(row[4])
  }
}
