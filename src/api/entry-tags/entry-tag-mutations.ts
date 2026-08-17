/**
 * Entry-Tag Mutation Functions
 *
 * Mutation operations for entry-tag associations.
 * Handles assigning and removing tags from entries.
 */

import { generateUUID } from '@/shared/utils/uuid-utils'

import type { AssignTagInput, EntryTag } from '@/shared/types/tag-types'
import type { Database } from 'sql.js'

/**
 * Assign a tag to an entry (idempotent)
 *
 * If a soft-deleted association already exists for the (entryId, tagId) pair,
 * reactivates it by setting is_deleted = 0 and updating updated_at.
 * Otherwise inserts a new row with a fresh UUID.
 *
 * @param db - SQLite database instance
 * @param input - AssignTagInput with entryId and tagId
 * @returns The created or reactivated EntryTag record
 *
 * @example
 * const et = assignTag(db, { entryId: 'entry-uuid', tagId: 'tag-uuid' })
 */
export function assignTag(db: Database, input: AssignTagInput): EntryTag {
  const { entryId, tagId } = input
  const now = Date.now()

  // Check for an existing soft-deleted association to reactivate
  const existing = db.exec(
    `SELECT id FROM entry_tags
     WHERE entry_id = ? AND tag_id = ? AND is_deleted = 1
     LIMIT 1`,
    [entryId, tagId]
  )

  if (existing[0]?.values[0]) {
    const existingId = existing[0].values[0][0] as string

    db.run(
      `UPDATE entry_tags SET is_deleted = 0, updated_at = ? WHERE id = ?`,
      [now, existingId]
    )

    return fetchEntryTagById(db, existingId)
  }

  // Also check for an active (non-deleted) association — idempotent no-op
  const active = db.exec(
    `SELECT id FROM entry_tags
     WHERE entry_id = ? AND tag_id = ? AND is_deleted = 0
     LIMIT 1`,
    [entryId, tagId]
  )

  if (active[0]?.values[0]) {
    const activeId = active[0].values[0][0] as string
    return fetchEntryTagById(db, activeId)
  }

  // Insert new association
  const id = generateUUID()

  db.run(
    `INSERT INTO entry_tags (id, entry_id, tag_id, created_at, updated_at, is_deleted)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [id, entryId, tagId, now, now]
  )

  return fetchEntryTagById(db, id)
}

/**
 * Remove a tag from an entry (soft-delete)
 *
 * Soft-deletes the association record rather than hard-deleting it,
 * to preserve sync compatibility.
 *
 * @param db - SQLite database instance
 * @param entryId - Entry UUID
 * @param tagId - Tag UUID
 */
export function removeTag(db: Database, entryId: string, tagId: string): void {
  const now = Date.now()

  db.run(
    `UPDATE entry_tags
     SET is_deleted = 1, updated_at = ?
     WHERE entry_id = ? AND tag_id = ? AND is_deleted = 0`,
    [now, entryId, tagId]
  )
}

/**
 * Soft-delete all active associations for a given tag
 *
 * Called by TagRepository.softDeleteTag to cascade the soft-delete.
 * Only marks currently active (is_deleted = 0) associations as deleted.
 *
 * @param db - SQLite database instance
 * @param tagId - Tag UUID whose associations should be soft-deleted
 */
export function softDeleteByTagId(db: Database, tagId: string): void {
  const now = Date.now()

  db.run(
    `UPDATE entry_tags
     SET is_deleted = 1, updated_at = ?
     WHERE tag_id = ? AND is_deleted = 0`,
    [now, tagId]
  )
}

/**
 * Convert SQLite query result row to EntryTag object
 *
 * Expected column order: id, entry_id, tag_id, created_at, updated_at, is_deleted
 */
function rowToEntryTag(row: unknown[]): EntryTag {
  return {
    id: row[0] as string,
    entryId: row[1] as string,
    tagId: row[2] as string,
    createdAt: row[3] as number,
    updatedAt: row[4] as number,
    isDeleted: Boolean(row[5])
  }
}
/**
 * Fetch an entry-tag association by ID
 *
 * Used internally after mutations to return the updated record.
 * @throws {Error} If the entry_tag row is not found
 */
function fetchEntryTagById(db: Database, id: string): EntryTag {
  const result = db.exec(
    'SELECT id, entry_id, tag_id, created_at, updated_at, is_deleted FROM entry_tags WHERE id = ?',
    [id]
  )
  const row = result[0]?.values[0]
  if (!row) {
    throw new Error(`entry_tags row not found: ${id}`)
  }
  return rowToEntryTag(row)
}
