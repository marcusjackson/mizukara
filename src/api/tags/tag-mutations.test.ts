/**
 * Tests for tag mutation functions
 */

import {
  createTestDatabaseForTags,
  seedEntryForTags,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it } from 'vitest'

import { createTag, renameTag, softDeleteTag } from './tag-mutations'
import { TagNotFoundError, TagValidationError } from './tag-validation'

import type { Database } from 'sql.js'

describe('tag-mutations', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForTags()
  })

  describe('createTag', () => {
    it('creates a tag with valid name', () => {
      const tag = createTag(db, { name: 'My Tag' })

      expect(tag.id).toBeTruthy()
      expect(tag.name).toBe('My Tag')
      expect(tag.isDeleted).toBe(false)
      expect(typeof tag.createdAt).toBe('number')
      expect(typeof tag.updatedAt).toBe('number')
    })

    it('persists the tag to the database', () => {
      const tag = createTag(db, { name: 'Persisted' })

      const result = db.exec('SELECT id FROM tags WHERE id = ?', [tag.id])
      expect(result[0]?.values).toHaveLength(1)
    })

    it('throws TagValidationError for empty name', () => {
      expect(() => createTag(db, { name: '' })).toThrow(TagValidationError)
    })

    it('throws TagValidationError for whitespace-only name', () => {
      expect(() => createTag(db, { name: '   ' })).toThrow(TagValidationError)
    })

    it('throws TagValidationError for duplicate name (exact match)', () => {
      createTag(db, { name: 'Duplicate' })

      expect(() => createTag(db, { name: 'Duplicate' })).toThrow(
        TagValidationError
      )
    })

    it('throws TagValidationError for duplicate name (case-insensitive)', () => {
      createTag(db, { name: 'typescript' })

      expect(() => createTag(db, { name: 'TypeScript' })).toThrow(
        TagValidationError
      )
    })

    it('allows creating a tag with the same name as a soft-deleted tag', () => {
      seedTag(db, { id: 'tag-deleted', name: 'Reused', isDeleted: true })

      const tag = createTag(db, { name: 'Reused' })

      expect(tag.name).toBe('Reused')
    })

    it('sets both timestamps to the same value at creation', () => {
      const tag = createTag(db, { name: 'Timestamps' })

      expect(tag.createdAt).toBe(tag.updatedAt)
    })

    it('generates a UUID for the tag id', () => {
      const tag = createTag(db, { name: 'UUID Tag' })

      // UUID v4 pattern
      expect(tag.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })
  })

  describe('renameTag', () => {
    it('renames a tag successfully', () => {
      const original = createTag(db, { name: 'Original' })

      const renamed = renameTag(db, original.id, 'Renamed')

      expect(renamed.name).toBe('Renamed')
      expect(renamed.id).toBe(original.id)
    })

    it('updates the updatedAt timestamp', () => {
      const original = createTag(db, { name: 'Original' })
      const beforeUpdate = original.updatedAt

      // Ensure time passes
      const renamed = renameTag(db, original.id, 'Renamed')

      expect(renamed.updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
    })

    it('throws TagNotFoundError for non-existent id', () => {
      expect(() => renameTag(db, 'nonexistent-id', 'New Name')).toThrow(
        TagNotFoundError
      )
    })

    it('throws TagNotFoundError for soft-deleted tag', () => {
      seedTag(db, { id: 'deleted-tag', name: 'Deleted', isDeleted: true })

      expect(() => renameTag(db, 'deleted-tag', 'New Name')).toThrow(
        TagNotFoundError
      )
    })

    it('throws TagValidationError for empty name', () => {
      const tag = createTag(db, { name: 'Valid' })

      expect(() => renameTag(db, tag.id, '')).toThrow(TagValidationError)
    })

    it('throws TagValidationError for whitespace-only name', () => {
      const tag = createTag(db, { name: 'Valid' })

      expect(() => renameTag(db, tag.id, '   ')).toThrow(TagValidationError)
    })

    it('throws TagValidationError when new name conflicts with another tag', () => {
      createTag(db, { name: 'Existing' })
      const tag = createTag(db, { name: 'ToRename' })

      expect(() => renameTag(db, tag.id, 'Existing')).toThrow(
        TagValidationError
      )
    })

    it('throws TagValidationError for case-insensitive duplicate name', () => {
      createTag(db, { name: 'existing' })
      const tag = createTag(db, { name: 'ToRename' })

      expect(() => renameTag(db, tag.id, 'EXISTING')).toThrow(
        TagValidationError
      )
    })

    it('allows renaming to the same name (case-insensitively)', () => {
      const tag = createTag(db, { name: 'MyTag' })

      const renamed = renameTag(db, tag.id, 'MYTAG')

      expect(renamed.name).toBe('MYTAG')
    })

    it('does not count the tag being renamed as a duplicate', () => {
      const tag = createTag(db, { name: 'Original' })

      const renamed = renameTag(db, tag.id, 'Original')

      expect(renamed.name).toBe('Original')
    })
  })

  describe('softDeleteTag', () => {
    it('soft-deletes the tag', () => {
      const tag = createTag(db, { name: 'ToDelete' })

      softDeleteTag(db, tag.id)

      const result = db.exec('SELECT is_deleted FROM tags WHERE id = ?', [
        tag.id
      ])
      expect(result[0]?.values[0]?.[0]).toBe(1)
    })

    it('updates updatedAt on soft-delete', () => {
      const tag = createTag(db, { name: 'ToDelete' })
      const before = tag.updatedAt

      softDeleteTag(db, tag.id)

      const result = db.exec('SELECT updated_at FROM tags WHERE id = ?', [
        tag.id
      ])
      const updatedAt = result[0]?.values[0]?.[0] as number
      expect(updatedAt).toBeGreaterThanOrEqual(before)
    })

    it('throws TagNotFoundError for non-existent id', () => {
      expect(() => {
        softDeleteTag(db, 'nonexistent-id')
      }).toThrow(TagNotFoundError)
    })

    it('throws TagNotFoundError for already soft-deleted tag', () => {
      seedTag(db, {
        id: 'deleted-tag',
        name: 'Already Deleted',
        isDeleted: true
      })

      expect(() => {
        softDeleteTag(db, 'deleted-tag')
      }).toThrow(TagNotFoundError)
    })

    it('cascades soft-delete to active entry_tag associations', () => {
      const tag = createTag(db, { name: 'Tagged' })
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: tag.id })

      softDeleteTag(db, tag.id)

      const result = db.exec('SELECT is_deleted FROM entry_tags WHERE id = ?', [
        'et-1'
      ])
      expect(result[0]?.values[0]?.[0]).toBe(1)
    })

    it('does not affect already soft-deleted entry_tag associations', () => {
      const tag = createTag(db, { name: 'Tagged' })
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedEntryTag(db, {
        id: 'et-already-deleted',
        entryId,
        tagId: tag.id,
        isDeleted: true
      })

      softDeleteTag(db, tag.id)

      const result = db.exec('SELECT is_deleted FROM entry_tags WHERE id = ?', [
        'et-already-deleted'
      ])
      expect(result[0]?.values[0]?.[0]).toBe(1)
    })

    it('cascades to multiple entry_tag associations', () => {
      const tag = createTag(db, { name: 'MultiTagged' })
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: tag.id })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: tag.id })

      softDeleteTag(db, tag.id)

      const result = db.exec(
        'SELECT COUNT(*) FROM entry_tags WHERE tag_id = ? AND is_deleted = 0',
        [tag.id]
      )
      expect(result[0]?.values[0]?.[0]).toBe(0)
    })

    it('rolls back the tag soft-delete when the entry_tag cascade fails', () => {
      const tag = createTag(db, { name: 'ToRollback' })

      // Drop entry_tags to force an error on the cascade write
      db.run('DROP TABLE entry_tags')

      expect(() => {
        softDeleteTag(db, tag.id)
      }).toThrow()

      // The tag must still be active — transaction was rolled back
      const result = db.exec('SELECT is_deleted FROM tags WHERE id = ?', [
        tag.id
      ])
      expect(result[0]?.values[0]?.[0]).toBe(0)
    })
  })
})
