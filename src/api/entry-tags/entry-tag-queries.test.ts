/**
 * Tests for entry-tag query functions
 */

import {
  createTestDatabaseForTags,
  seedEntryForTags,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  findByEntryId,
  findByEntryIds,
  findEntriesByTags
} from './entry-tag-queries'

import type { Database } from 'sql.js'

describe('entry-tag-queries', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForTags()
  })

  describe('findByEntryId', () => {
    it('returns empty array when entry has no tags', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })

      const result = findByEntryId(db, entryId)

      expect(result).toEqual([])
    })

    it('returns all active tags for an entry', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Alpha' })
      seedTag(db, { id: 'tag-2', name: 'Beta' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId, tagId: 'tag-2' })

      const result = findByEntryId(db, entryId)

      expect(result).toHaveLength(2)
      const names = result.map((t) => t.name).sort((a, b) => a.localeCompare(b))
      expect(names).toEqual(['Alpha', 'Beta'])
    })

    it('excludes soft-deleted associations', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Active' })
      seedTag(db, { id: 'tag-2', name: 'Removed' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId, tagId: 'tag-2', isDeleted: true })

      const result = findByEntryId(db, entryId)

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Active')
    })

    it('excludes soft-deleted tags', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Active' })
      seedTag(db, { id: 'tag-2', name: 'DeletedTag', isDeleted: true })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId, tagId: 'tag-2' })

      const result = findByEntryId(db, entryId)

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Active')
    })

    it('returns tags for the correct entry only', () => {
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedTag(db, { id: 'tag-1', name: 'OnBoth' })
      seedTag(db, { id: 'tag-2', name: 'OnlyEntry2' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-3', entryId: entryId2, tagId: 'tag-2' })

      const result = findByEntryId(db, entryId1)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('tag-1')
    })

    it('returns Tag objects with all required properties', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'MyTag' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })

      const result = findByEntryId(db, entryId)

      const tag = result[0]!
      expect(tag.id).toBe('tag-1')
      expect(tag.name).toBe('MyTag')
      expect(typeof tag.createdAt).toBe('number')
      expect(typeof tag.updatedAt).toBe('number')
      expect(tag.isDeleted).toBe(false)
    })
  })

  describe('findByEntryIds', () => {
    it('returns an empty Map when no entry IDs are provided', () => {
      const result = findByEntryIds(db, [])

      expect(result.size).toBe(0)
    })

    it('returns a Map with tags for each entry', () => {
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedTag(db, { id: 'tag-1', name: 'Shared' })
      seedTag(db, { id: 'tag-2', name: 'OnlyEntry2' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-3', entryId: entryId2, tagId: 'tag-2' })

      const result = findByEntryIds(db, [entryId1, entryId2])

      expect(result.size).toBe(2)
      expect(result.get(entryId1)).toHaveLength(1)
      expect(result.get(entryId1)![0]!.id).toBe('tag-1')
      expect(result.get(entryId2)).toHaveLength(2)
    })

    it('maps entries with no tags to an empty array', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })

      const result = findByEntryIds(db, [entryId])

      expect(result.size).toBe(1)
      expect(result.get(entryId)).toEqual([])
    })

    it('excludes soft-deleted associations', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Active' })
      seedTag(db, { id: 'tag-2', name: 'Removed' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId, tagId: 'tag-2', isDeleted: true })

      const result = findByEntryIds(db, [entryId])

      expect(result.get(entryId)).toHaveLength(1)
      expect(result.get(entryId)![0]!.name).toBe('Active')
    })

    it('excludes soft-deleted tags', () => {
      const entryId = seedEntryForTags(db, { id: 'entry-1' })
      seedTag(db, { id: 'tag-1', name: 'Active' })
      seedTag(db, { id: 'tag-2', name: 'DeletedTag', isDeleted: true })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId, tagId: 'tag-2' })

      const result = findByEntryIds(db, [entryId])

      expect(result.get(entryId)).toHaveLength(1)
      expect(result.get(entryId)![0]!.name).toBe('Active')
    })

    it('only includes entries from the requested IDs', () => {
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedTag(db, { id: 'tag-1', name: 'Tag' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })

      const result = findByEntryIds(db, [entryId1])

      expect(result.size).toBe(1)
      expect(result.has(entryId2)).toBe(false)
    })
  })

  describe('findEntriesByTags', () => {
    it('returns empty array when no tag IDs are provided', () => {
      seedEntryForTags(db, { id: 'entry-1' })

      const result = findEntriesByTags(db, [])

      expect(result).toEqual([])
    })

    it('returns entries matching a single tag', () => {
      const entryId1 = seedEntryForTags(db, {
        id: 'entry-1',
        assignedDay: '2026-01-01'
      })
      const entryId2 = seedEntryForTags(db, {
        id: 'entry-2',
        assignedDay: '2026-01-02'
      })
      seedEntryForTags(db, { id: 'entry-3', assignedDay: '2026-01-03' })
      seedTag(db, { id: 'tag-1', name: 'Featured' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })

      const result = findEntriesByTags(db, ['tag-1'])

      expect(result).toHaveLength(2)
      const ids = result.map((e) => e.id)
      expect(ids).toContain(entryId1)
      expect(ids).toContain(entryId2)
    })

    it('returns only entries matching all tags (intersection semantics)', () => {
      const entryId1 = seedEntryForTags(db, {
        id: 'entry-1',
        assignedDay: '2026-01-01'
      })
      const entryId2 = seedEntryForTags(db, {
        id: 'entry-2',
        assignedDay: '2026-01-02'
      })
      seedTag(db, { id: 'tag-1', name: 'Alpha' })
      seedTag(db, { id: 'tag-2', name: 'Beta' })
      // entry-1 has both tags
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId1, tagId: 'tag-2' })
      // entry-2 has only tag-1
      seedEntryTag(db, { id: 'et-3', entryId: entryId2, tagId: 'tag-1' })

      const result = findEntriesByTags(db, ['tag-1', 'tag-2'])

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe(entryId1)
    })

    it('returns entries with 3 tags when all three match', () => {
      const entryId1 = seedEntryForTags(db, {
        id: 'entry-1',
        assignedDay: '2026-01-01'
      })
      const entryId2 = seedEntryForTags(db, {
        id: 'entry-2',
        assignedDay: '2026-01-02'
      })
      seedTag(db, { id: 'tag-1', name: 'A' })
      seedTag(db, { id: 'tag-2', name: 'B' })
      seedTag(db, { id: 'tag-3', name: 'C' })
      // entry-1 has all 3 tags
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId1, tagId: 'tag-2' })
      seedEntryTag(db, { id: 'et-3', entryId: entryId1, tagId: 'tag-3' })
      // entry-2 has only 2 tags
      seedEntryTag(db, { id: 'et-4', entryId: entryId2, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-5', entryId: entryId2, tagId: 'tag-2' })

      const result = findEntriesByTags(db, ['tag-1', 'tag-2', 'tag-3'])

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe(entryId1)
    })

    it('orders results by assigned_day descending', () => {
      const entryId1 = seedEntryForTags(db, {
        id: 'entry-1',
        assignedDay: '2026-01-01'
      })
      const entryId2 = seedEntryForTags(db, {
        id: 'entry-2',
        assignedDay: '2026-01-03'
      })
      const entryId3 = seedEntryForTags(db, {
        id: 'entry-3',
        assignedDay: '2026-01-02'
      })
      seedTag(db, { id: 'tag-1', name: 'All' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-3', entryId: entryId3, tagId: 'tag-1' })

      const result = findEntriesByTags(db, ['tag-1'])

      expect(result[0]!.assignedDay).toBe('2026-01-03')
      expect(result[1]!.assignedDay).toBe('2026-01-02')
      expect(result[2]!.assignedDay).toBe('2026-01-01')
    })

    it('excludes soft-deleted entries', () => {
      const entryId = seedEntryForTags(db, {
        id: 'entry-1',
        isDeleted: true,
        assignedDay: '2026-01-01'
      })
      seedTag(db, { id: 'tag-1', name: 'Tag' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })

      const result = findEntriesByTags(db, ['tag-1'])

      expect(result).toHaveLength(0)
    })

    it('excludes entries with only soft-deleted associations', () => {
      const entryId = seedEntryForTags(db, {
        id: 'entry-1',
        assignedDay: '2026-01-01'
      })
      seedTag(db, { id: 'tag-1', name: 'Tag' })
      seedEntryTag(db, {
        id: 'et-1',
        entryId,
        tagId: 'tag-1',
        isDeleted: true
      })

      const result = findEntriesByTags(db, ['tag-1'])

      expect(result).toHaveLength(0)
    })

    it('returns Entry objects with all required properties', () => {
      const entryId = seedEntryForTags(db, {
        id: 'entry-1',
        assignedDay: '2026-02-01'
      })
      seedTag(db, { id: 'tag-1', name: 'Tag' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: 'tag-1' })

      const result = findEntriesByTags(db, ['tag-1'])

      const entry = result[0]!
      expect(entry.id).toBe(entryId)
      expect(entry.assignedDay).toBe('2026-02-01')
      expect(typeof entry.content).toBe('string')
      expect(typeof entry.createdAt).toBe('number')
      expect(typeof entry.updatedAt).toBe('number')
      expect(typeof entry.orderPosition).toBe('number')
      expect(entry.isDeleted).toBe(false)
    })
  })
})
