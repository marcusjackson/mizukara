/**
 * Tests for tag query functions
 */

import {
  createTestDatabaseForTags,
  seedEntryForTags,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it } from 'vitest'

import { findAllNames, findAllWithCount, findById } from './tag-queries'

import type { Database } from 'sql.js'

describe('tag-queries', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForTags()
  })

  describe('findAllWithCount', () => {
    it('returns empty array when no tags exist', () => {
      const result = findAllWithCount(db)

      expect(result).toEqual([])
    })

    it('returns all non-deleted tags ordered by name ascending', () => {
      seedTag(db, { id: 'tag-1', name: 'Zebra' })
      seedTag(db, { id: 'tag-2', name: 'Alpha' })
      seedTag(db, { id: 'tag-3', name: 'Mango' })

      const result = findAllWithCount(db)

      expect(result).toHaveLength(3)
      expect(result[0]!.name).toBe('Alpha')
      expect(result[1]!.name).toBe('Mango')
      expect(result[2]!.name).toBe('Zebra')
    })

    it('excludes soft-deleted tags', () => {
      seedTag(db, { id: 'tag-1', name: 'Active' })
      seedTag(db, { id: 'tag-2', name: 'Deleted', isDeleted: true })

      const result = findAllWithCount(db)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('tag-1')
    })

    it('includes zero-count tags', () => {
      seedTag(db, { id: 'tag-1', name: 'NoEntries' })

      const result = findAllWithCount(db)

      expect(result).toHaveLength(1)
      expect(result[0]!.entryCount).toBe(0)
    })

    it('returns correct entry count for tags with associations', () => {
      seedTag(db, { id: 'tag-1', name: 'Popular' })
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, { id: 'et-2', entryId: entryId2, tagId: 'tag-1' })

      const result = findAllWithCount(db)

      expect(result[0]!.entryCount).toBe(2)
    })

    it('does not count soft-deleted associations', () => {
      seedTag(db, { id: 'tag-1', name: 'Tag' })
      const entryId1 = seedEntryForTags(db, { id: 'entry-1' })
      const entryId2 = seedEntryForTags(db, { id: 'entry-2' })
      seedEntryTag(db, { id: 'et-1', entryId: entryId1, tagId: 'tag-1' })
      seedEntryTag(db, {
        id: 'et-2',
        entryId: entryId2,
        tagId: 'tag-1',
        isDeleted: true
      })

      const result = findAllWithCount(db)

      expect(result[0]!.entryCount).toBe(1)
    })

    it('returns tags with all required properties', () => {
      seedTag(db, { id: 'tag-1', name: 'MyTag' })

      const result = findAllWithCount(db)

      const tag = result[0]!
      expect(tag.id).toBe('tag-1')
      expect(tag.name).toBe('MyTag')
      expect(typeof tag.createdAt).toBe('number')
      expect(typeof tag.updatedAt).toBe('number')
      expect(tag.isDeleted).toBe(false)
      expect(typeof tag.entryCount).toBe('number')
    })
  })

  describe('findById', () => {
    it('returns the tag when found', () => {
      seedTag(db, { id: 'tag-1', name: 'Found' })

      const result = findById(db, 'tag-1')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('tag-1')
      expect(result!.name).toBe('Found')
    })

    it('returns null when tag does not exist', () => {
      const result = findById(db, 'nonexistent-id')

      expect(result).toBeNull()
    })

    it('returns null for soft-deleted tag', () => {
      seedTag(db, { id: 'tag-1', name: 'Deleted', isDeleted: true })

      const result = findById(db, 'tag-1')

      expect(result).toBeNull()
    })

    it('returns tag with all required properties', () => {
      seedTag(db, { id: 'tag-1', name: 'MyTag' })

      const result = findById(db, 'tag-1')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('tag-1')
      expect(result!.name).toBe('MyTag')
      expect(typeof result!.createdAt).toBe('number')
      expect(typeof result!.updatedAt).toBe('number')
      expect(result!.isDeleted).toBe(false)
    })
  })

  describe('findAllNames', () => {
    it('returns empty array when no tags exist', () => {
      const result = findAllNames(db)

      expect(result).toEqual([])
    })

    it('returns id and name for all non-deleted tags', () => {
      seedTag(db, { id: 'tag-1', name: 'Alpha' })
      seedTag(db, { id: 'tag-2', name: 'Beta' })

      const result = findAllNames(db)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ id: 'tag-1', name: 'Alpha' })
      expect(result[1]).toEqual({ id: 'tag-2', name: 'Beta' })
    })

    it('excludes soft-deleted tags', () => {
      seedTag(db, { id: 'tag-1', name: 'Active' })
      seedTag(db, { id: 'tag-2', name: 'Deleted', isDeleted: true })

      const result = findAllNames(db)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('tag-1')
    })

    it('returns results ordered by name ascending', () => {
      seedTag(db, { id: 'tag-1', name: 'Zebra' })
      seedTag(db, { id: 'tag-2', name: 'Alpha' })

      const result = findAllNames(db)

      expect(result[0]!.name).toBe('Alpha')
      expect(result[1]!.name).toBe('Zebra')
    })

    it('returns only id and name properties', () => {
      seedTag(db, { id: 'tag-1', name: 'OnlyIdName' })

      const result = findAllNames(db)

      expect(Object.keys(result[0]!)).toEqual(['id', 'name'])
    })
  })
})
