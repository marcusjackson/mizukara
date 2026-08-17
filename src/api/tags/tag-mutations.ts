/**
 * Tag Mutation Functions
 *
 * Write operations for tag entities.
 * Handles creating, renaming, and soft-deleting tags.
 */

import { softDeleteByTagId } from '@/api/entry-tags/entry-tag-mutations'

import { generateUUID } from '@/shared/utils/uuid-utils'

import { rowToTag } from './tag-row-mappers'
import { TagNotFoundError, TagValidationError } from './tag-validation'

import type { CreateTagInput, Tag } from '@/shared/types/tag-types'
import type { Database } from 'sql.js'

/**
 * Fetch tag by ID from database (includes soft-deleted)
 *
 * Used internally after mutations to return the updated tag.
 */
function fetchTagByIdRaw(db: Database, id: string): Tag {
  const result = db.exec(
    'SELECT id, name, created_at, updated_at, is_deleted FROM tags WHERE id = ?',
    [id]
  )

  if (!result[0]?.values[0]) {
    throw new TagNotFoundError(id)
  }

  return rowToTag(result[0].values[0])
}

/**
 * Assert tag name is non-empty after trimming whitespace
 *
 * @throws {TagValidationError} If name is empty after trim
 */
function assertNameNonEmpty(name: string): void {
  if (!name.trim()) {
    throw new TagValidationError('Tag name must not be empty')
  }
}

/**
 * Assert no existing non-deleted tag has the same name (case-insensitive)
 *
 * @param excludeId - Optional tag ID to exclude from the uniqueness check (used during rename)
 * @throws {TagValidationError} If a duplicate name exists
 */
function assertNameUnique(
  db: Database,
  name: string,
  excludeId?: string
): void {
  const trimmedName = name.trim()

  const result = excludeId
    ? db.exec(
        `SELECT id FROM tags
         WHERE LOWER(name) = LOWER(?) AND id != ? AND is_deleted = 0
         LIMIT 1`,
        [trimmedName, excludeId]
      )
    : db.exec(
        `SELECT id FROM tags
         WHERE LOWER(name) = LOWER(?) AND is_deleted = 0
         LIMIT 1`,
        [trimmedName]
      )

  if (result[0]?.values[0]) {
    throw new TagValidationError(`A tag named "${trimmedName}" already exists`)
  }
}

/**
 * Create a new tag
 *
 * Validates the name is non-empty after trim, checks case-insensitive uniqueness
 * among non-deleted tags, then generates a UUID and inserts the tag.
 *
 * @param db - SQLite database instance
 * @param input - CreateTagInput with name
 * @returns Newly created tag with all generated fields
 * @throws {TagValidationError} If name is empty or a non-deleted tag with the same name exists
 *
 * @example
 * const tag = createTag(db, { name: 'TypeScript' })
 * console.log(tag.id) // '550e8400-...'
 */
export function createTag(db: Database, input: CreateTagInput): Tag {
  const { name } = input

  assertNameNonEmpty(name)
  assertNameUnique(db, name)

  const id = generateUUID()
  const now = Date.now()

  db.run(
    `INSERT INTO tags (id, name, created_at, updated_at, is_deleted)
     VALUES (?, ?, ?, ?, 0)`,
    [id, name.trim(), now, now]
  )

  return fetchTagByIdRaw(db, id)
}

/**
 * Rename an existing tag
 *
 * Validates the new name is non-empty after trim and checks case-insensitive
 * uniqueness excluding the tag being renamed (allowing same-name round-trips).
 *
 * @param db - SQLite database instance
 * @param id - Tag UUID
 * @param name - New name for the tag
 * @returns Updated tag
 * @throws {TagNotFoundError} If the tag does not exist or is soft-deleted
 * @throws {TagValidationError} If name is empty or conflicts with another non-deleted tag
 *
 * @example
 * const tag = renameTag(db, 'tag-uuid', 'New Name')
 */
export function renameTag(db: Database, id: string, name: string): Tag {
  // Verify the tag exists and is not deleted
  const existing = db.exec(
    'SELECT id FROM tags WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [id]
  )
  if (!existing[0]?.values[0]) {
    throw new TagNotFoundError(id)
  }

  assertNameNonEmpty(name)
  assertNameUnique(db, name, id)

  const now = Date.now()

  db.run('UPDATE tags SET name = ?, updated_at = ? WHERE id = ?', [
    name.trim(),
    now,
    id
  ])

  return fetchTagByIdRaw(db, id)
}

/**
 * Soft-delete a tag and cascade to its associations
 *
 * Sets is_deleted = 1 and updates updated_at on the tag, then calls
 * softDeleteByTagId to cascade the soft-delete to all active entry_tags
 * associations for this tag.
 *
 * @param db - SQLite database instance
 * @param id - Tag UUID
 * @throws {TagNotFoundError} If the tag does not exist or is already soft-deleted
 *
 * @example
 * softDeleteTag(db, 'tag-uuid')
 */
export function softDeleteTag(db: Database, id: string): void {
  const existing = db.exec(
    'SELECT id FROM tags WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [id]
  )
  if (!existing[0]?.values[0]) {
    throw new TagNotFoundError(id)
  }

  const now = Date.now()

  db.run('BEGIN TRANSACTION')
  try {
    db.run('UPDATE tags SET is_deleted = 1, updated_at = ? WHERE id = ?', [
      now,
      id
    ])

    // Cascade: soft-delete all active associations for this tag
    softDeleteByTagId(db, id)

    db.run('COMMIT')
  } catch (error) {
    db.run('ROLLBACK')
    throw error
  }
}
