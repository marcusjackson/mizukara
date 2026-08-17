/**
 * Entry-Tag Query Functions
 *
 * Read operations for entry-tag associations.
 * All queries filter by is_deleted = 0 to return only active records.
 */

import { queryResultToEntries } from '@/api/entries/entry-helpers'
import { rowToTag } from '@/api/tags/tag-row-mappers'

import type { Entry } from '@/shared/types/entry-types'
import type { Tag } from '@/shared/types/tag-types'
import type { Database } from 'sql.js'

/**
 * Find all non-deleted tags associated with a single entry
 *
 * Returns only active (non-deleted) associations and non-deleted tags.
 *
 * @param db - SQLite database instance
 * @param entryId - Entry UUID
 * @returns Array of Tag objects associated with the entry
 *
 * @example
 * const tags = findByEntryId(db, 'entry-uuid')
 * // Returns [{ id: 'tag-uuid', name: 'work', ... }, ...]
 */
export function findByEntryId(db: Database, entryId: string): Tag[] {
  const result = db.exec(
    `SELECT t.id, t.name, t.created_at, t.updated_at, t.is_deleted
     FROM tags t
     INNER JOIN entry_tags et ON et.tag_id = t.id
     WHERE et.entry_id = ?
       AND et.is_deleted = 0
       AND t.is_deleted = 0`,
    [entryId]
  )

  if (!result[0]) return []

  return result[0].values.map(rowToTag)
}

/**
 * Batch fetch tags for multiple entries
 *
 * Returns a Map where each entry ID is mapped to its array of active tags.
 * Entries with no tags are included in the Map with an empty array.
 * Used by the day-view to merge tag data after fetching entries.
 *
 * @param db - SQLite database instance
 * @param entryIds - Array of entry UUIDs to fetch tags for
 * @returns Map<entryId, Tag[]> for all requested entry IDs
 *
 * @example
 * const tagMap = findByEntryIds(db, ['entry-1', 'entry-2'])
 * const tags = tagMap.get('entry-1') // Tag[]
 */
export function findByEntryIds(
  db: Database,
  entryIds: string[]
): Map<string, Tag[]> {
  const result = new Map<string, Tag[]>()

  if (entryIds.length === 0) return result

  // Initialise all requested entries with empty arrays
  for (const id of entryIds) {
    result.set(id, [])
  }

  const placeholders = entryIds.map(() => '?').join(', ')

  const queryResult = db.exec(
    `SELECT et.entry_id, t.id, t.name, t.created_at, t.updated_at, t.is_deleted
     FROM entry_tags et
     INNER JOIN tags t ON t.id = et.tag_id
     WHERE et.entry_id IN (${placeholders})
       AND et.is_deleted = 0
       AND t.is_deleted = 0`,
    entryIds
  )

  if (!queryResult[0]) return result

  for (const row of queryResult[0].values) {
    const entryId = row[0] as string
    const tag = rowToTag(row.slice(1))
    const tags = result.get(entryId)
    if (tags) {
      tags.push(tag)
    }
  }

  return result
}

/**
 * Find non-deleted entries that match ALL provided tag IDs (intersection semantics)
 *
 * Returns entries ordered by assigned_day descending.
 * Returns an empty array when tagIds is empty.
 *
 * @param db - SQLite database instance
 * @param tagIds - Array of tag UUIDs; entry must have all tags to be included
 * @returns Array of Entry objects ordered by assigned_day descending
 *
 * @example
 * const entries = findEntriesByTags(db, ['tag-1', 'tag-2'])
 * // Returns entries that have BOTH tag-1 and tag-2, newest day first
 */
export function findEntriesByTags(db: Database, tagIds: string[]): Entry[] {
  if (tagIds.length === 0) return []

  const placeholders = tagIds.map(() => '?').join(', ')

  const result = db.exec(
    `SELECT e.id, e.content, e.created_at, e.updated_at,
            e.assigned_day, e.order_position, e.is_deleted
     FROM entries e
     INNER JOIN entry_tags et ON et.entry_id = e.id AND et.is_deleted = 0
     WHERE e.is_deleted = 0
       AND et.tag_id IN (${placeholders})
     GROUP BY e.id
     HAVING COUNT(DISTINCT et.tag_id) = ?
     ORDER BY e.assigned_day DESC`,
    [...tagIds, tagIds.length]
  )

  if (!result[0]) return []

  return queryResultToEntries(result[0])
}
