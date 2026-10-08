/**
 * Entry-Tag Row Mapper Functions
 *
 * Maps SQLite result rows to EntryTag objects, the counterpart of
 * `@/api/tags/tag-row-mappers`.
 */

import { assertNumber, assertString } from '@/api/row-assertions'

import type { EntryTag } from '@/shared/types/tag-types'

/**
 * Convert SQLite query result row to EntryTag object
 *
 * Expected column order: id, entry_id, tag_id, created_at, updated_at, is_deleted
 *
 * @param row - Database row as array of values
 * @returns EntryTag object with typed properties
 * @throws {TypeError} If a cell is not the type its column should hold
 */
export function rowToEntryTag(row: unknown[]): EntryTag {
  return {
    id: assertString(row[0], 'id', 'rowToEntryTag'),
    entryId: assertString(row[1], 'entry_id', 'rowToEntryTag'),
    tagId: assertString(row[2], 'tag_id', 'rowToEntryTag'),
    createdAt: assertNumber(row[3], 'created_at', 'rowToEntryTag'),
    updatedAt: assertNumber(row[4], 'updated_at', 'rowToEntryTag'),
    isDeleted: Boolean(row[5])
  }
}
