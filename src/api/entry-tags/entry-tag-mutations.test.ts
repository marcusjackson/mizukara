/**
 * Tests for entry-tag mutation functions
 */

import {
  createTestDatabaseForTags,
  seedEntryForTags,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it } from 'vitest'

import { assignTag, removeTag, softDeleteByTagId } from './entry-tag-mutations'

import type { Database } from 'sql.js'

describe('entry-tag-mutations', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForTags()
  })

  describe('assignTag', () => {
    it('creates a new association when none exists', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })

      const result = assignTag(db, { entryId, tagId: 'tag-1' })

      expect(result.entryId).toBe(entryId)
      expect(result.tagId).toBe('tag-1')
      expect(result.isDeleted).toBe(false)
      expect(typeof result.id).toBe('string')
      expect(typeof result.createdAt).toBe('number')
      expect(typeof result.updatedAt).toBe('number')
    })

    it('generates a UUID for the new association id', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })

      const result = assignTag(db, { entryId, tagId: 'tag-1' })

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('persists the association to the database', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })

      const result = assignTag(db, { entryId, tagId: 'tag-1' })

      const rows = db.exec('SELECT id FROM entry_tags WHERE id = ?', [
        result.id
      ])
      expect(rows[0]?.values).toHaveLength(1)
    })

    it('reactivates a soft-deleted association (idempotent)', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      const et = seedEntryTag(db, {
        id: 'et-1',
        entryId,
        tagId: 'tag-1',
        isDeleted: true
      })

      const result = assignTag(db, { entryId, tagId: 'tag-1' })

      expect(result.id).toBe(et.id)
      expect(result.isDeleted).toBe(false)
    })

    it('does not create a duplicate row when reactivating', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1', isDeleted: true })

      assignTag(db, { entryId, tagId: 'tag-1' })

      const rows = db.exec(
        `SELECT id FROM entry_tags WHERE entry_id = ? AND tag_id = ?`,
        [entryId, 'tag-1']
      )
      expect(rows[0]?.values).toHaveLength(1)
    })

    it('is a no-op when association is already active', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      const existing = seedEntryTag(db, {
        id: 'et-1',
        entryId,
        tagId: 'tag-1'
      })

      const result = assignTag(db, { entryId, tagId: 'tag-1' })

      expect(result.id).toBe(existing.id)
      expect(result.isDeleted).toBe(false)
      const rows = db.exec(
        `SELECT id FROM entry_tags WHERE entry_id = ? AND tag_id = ?`,
        [entryId, 'tag-1']
      )
      expect(rows[0]?.values).toHaveLength(1)
    })

    it('sets createdAt and updatedAt on new association', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })

      const before = Date.now()
      const result = assignTag(db, { entryId, tagId: 'tag-1' })
      const after = Date.now()

      expect(result.createdAt).toBeGreaterThanOrEqual(before)
      expect(result.createdAt).toBeLessThanOrEqual(after)
      expect(result.updatedAt).toBe(result.createdAt)
    })
  })

  describe('removeTag', () => {
    it('soft-deletes an active association', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })

      removeTag(db, entryId, 'tag-1')

      const rows = db.exec(
        `SELECT is_deleted FROM entry_tags WHERE id = 'et-1'`
      )
      expect(rows[0]?.values[0]?.[0]).toBe(1)
    })

    it('preserves the association row (does not hard-delete)', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })

      removeTag(db, entryId, 'tag-1')

      const rows = db.exec(`SELECT id FROM entry_tags WHERE id = 'et-1'`)
      expect(rows[0]?.values).toHaveLength(1)
    })

    it('updates updated_at when removing', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      const et = seedEntryTag(db, {
        id: 'et-1',
        entryId,
        tagId: 'tag-1',
        updatedAt: 1000
      })

      removeTag(db, entryId, 'tag-1')

      const rows = db.exec(`SELECT updated_at FROM entry_tags WHERE id = ?`, [
        et.id
      ])
      const updatedAt = rows[0]?.values[0]?.[0] as number
      expect(updatedAt).toBeGreaterThan(1000)
    })

    it('is a no-op when no active association exists', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })

      // Should not throw even if no row exists
      expect(() => {
        removeTag(db, entryId, 'tag-1')
      }).not.toThrow()
    })

    it('does not affect associations for other entries', () => {
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })

      removeTag(db, entryId1, 'tag-1')

      const rows = db.exec(
        `SELECT is_deleted FROM entry_tags WHERE id = 'et-2'`
      )
      expect(rows[0]?.values[0]?.[0]).toBe(0)
    })
  })

  describe('softDeleteByTagId', () => {
    it('soft-deletes all active associations for a tag', () => {
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })

      softDeleteByTagId(db, 'tag-1')

      const rows = db.exec(
        `SELECT is_deleted FROM entry_tags WHERE tag_id = 'tag-1'`
      )
      for (const row of rows[0]?.values ?? []) {
        expect(row[0]).toBe(1)
      }
    })

    it('does not affect associations for other tags', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      seedTag(db, { id: 'tag-2', name: 'Personal' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId, tagId: 'tag-2' })

      softDeleteByTagId(db, 'tag-1')

      const rows = db.exec(
        `SELECT is_deleted FROM entry_tags WHERE id = 'et-2'`
      )
      expect(rows[0]?.values[0]?.[0]).toBe(0)
    })

    it('preserves already-deleted associations (does not update their updated_at)', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      const alreadyDeleted = seedEntryTag(db, {
        id: 'et-already-deleted',
        entryId,
        tagId: 'tag-1',
        isDeleted: true,
        updatedAt: 1000
      })

      softDeleteByTagId(db, 'tag-1')

      const rows = db.exec(`SELECT updated_at FROM entry_tags WHERE id = ?`, [
        alreadyDeleted.id
      ])
      // Already-deleted row should not be touched (WHERE is_deleted = 0 in the UPDATE)
      expect(rows[0]?.values[0]?.[0]).toBe(1000)
    })

    it('is a no-op when tag has no active associations', () => {
      seedTag(db, { id: 'tag-1', name: 'Work' })

      expect(() => {
        softDeleteByTagId(db, 'tag-1')
      }).not.toThrow()
    })

    it('updates updated_at on newly soft-deleted rows', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Work' })
      const et = seedEntryTag(db, {
        id: 'et-1',
        entryId,
        tagId: 'tag-1',
        updatedAt: 1000
      })

      softDeleteByTagId(db, 'tag-1')

      const rows = db.exec(`SELECT updated_at FROM entry_tags WHERE id = ?`, [
        et.id
      ])
      const updatedAt = rows[0]?.values[0]?.[0] as number
      expect(updatedAt).toBeGreaterThan(1000)
    })
  })
})
