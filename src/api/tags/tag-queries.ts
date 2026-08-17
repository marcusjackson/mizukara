/**
 * Tag Query Functions
 *
 * Read operations for tag entities.
 * All queries filter by is_deleted = 0 to return only active records.
 */

import { rowToTag } from './tag-row-mappers'

import type { Tag, TagWithCount } from '@/shared/types/tag-types'
import type { Database } from 'sql.js'

/**
 * Find all non-deleted tags with their non-deleted association counts
 *
 * Returns tags ordered by name ascending. Includes zero-count tags.
 * Count reflects active (non-deleted) entry_tags associations only.
 *
 * @param db - SQLite database instance
 * @returns Array of tags with entryCount, ordered by name ascending
 *
 * @example
 * const tags = findAllWithCount(db)
 * // Returns [{ id: '...', name: 'alpha', entryCount: 3, ... }, ...]
 */
export function findAllWithCount(db: Database): TagWithCount[] {
  const result = db.exec(`
    SELECT
      t.id,
      t.name,
      t.created_at,
      t.updated_at,
      t.is_deleted,
      COUNT(et.id) AS entry_count
    FROM tags t
    LEFT JOIN entry_tags et ON et.tag_id = t.id AND et.is_deleted = 0
    WHERE t.is_deleted = 0
    GROUP BY t.id
    ORDER BY t.name ASC
  `)

  if (!result[0]) return []

  return result[0].values.map((row) => ({
    ...rowToTag(row),
    entryCount: row[5] as number
  }))
}

/**
 * Find a single tag by ID
 *
 * Returns null if the tag does not exist or has been soft-deleted.
 *
 * @param db - SQLite database instance
 * @param id - Tag UUID
 * @returns Tag object if found and active, null otherwise
 *
 * @example
 * const tag = findById(db, '550e8400-e29b-41d4-a716-446655440000')
 * if (tag) {
 *   console.log(tag.name)
 * }
 */
export function findById(db: Database, id: string): Tag | null {
  const result = db.exec(
    `
    SELECT id, name, created_at, updated_at, is_deleted
    FROM tags
    WHERE id = ? AND is_deleted = 0
    LIMIT 1
  `,
    [id]
  )

  if (!result[0]?.values[0]) return null

  return rowToTag(result[0].values[0])
}

/**
 * Find all non-deleted tag names (lightweight read)
 *
 * Returns only id and name fields. Used for LLM context and autocomplete
 * scenarios where the full tag object is not required.
 *
 * @param db - SQLite database instance
 * @returns Array of { id, name } objects ordered by name ascending
 *
 * @example
 * const names = findAllNames(db)
 * // Returns [{ id: '...', name: 'alpha' }, { id: '...', name: 'beta' }]
 */
export function findAllNames(db: Database): Pick<Tag, 'id' | 'name'>[] {
  const result = db.exec(`
    SELECT id, name
    FROM tags
    WHERE is_deleted = 0
    ORDER BY name ASC
  `)

  if (!result[0]) return []

  return result[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string
  }))
}
