/**
 * Tests for search query functions
 */

import {
  createTestDatabaseForSearch,
  seedEntry,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it } from 'vitest'

import { findDayCounts, search } from './search-queries'

import type { Database } from 'sql.js'

describe('search', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForSearch()
  })

  it('returns [] without querying when neither query nor tagIds is provided', () => {
    seedEntry(db, { content: 'hello world' })

    const result = search(db, {}, { capped: true })

    expect(result).toEqual([])
  })

  it('returns [] when tagIds is an empty array and no query is given', () => {
    seedEntry(db, { content: 'hello world' })

    const result = search(db, { tagIds: [] }, { capped: true })

    expect(result).toEqual([])
  })

  describe('text-only search', () => {
    it('matches entries whose content matches the query', () => {
      const match = seedEntry(db, {
        id: 'entry-1',
        content: 'went running in the park'
      })
      seedEntry(db, { id: 'entry-2', content: 'ate breakfast' })

      const result = search(db, { query: 'run' }, { capped: true })

      expect(result.map((e) => e.id)).toEqual([match.id])
    })

    it('benefits from porter stemming', () => {
      const match = seedEntry(db, {
        id: 'entry-1',
        content: 'running quickly'
      })

      const result = search(db, { query: 'run' }, { capped: true })

      expect(result.map((e) => e.id)).toEqual([match.id])
    })

    it('excludes soft-deleted entries even if their content matches', () => {
      seedEntry(db, {
        id: 'entry-1',
        content: 'deleted entry content',
        isDeleted: true
      })

      const result = search(db, { query: 'deleted' }, { capped: true })

      expect(result).toEqual([])
    })

    it('returns [] when nothing matches', () => {
      seedEntry(db, { content: 'hello world' })

      const result = search(db, { query: 'nonexistent' }, { capped: true })

      expect(result).toEqual([])
    })

    it('does not throw on a query containing FTS4 operator syntax', () => {
      seedEntry(db, { id: 'entry-1', content: 'went running today' })

      // A stray quote, an unbalanced paren, and a bare boolean-operator word
      // are all FTS4 query syntax if unsanitized — none should throw.
      expect(() => search(db, { query: '"' }, { capped: true })).not.toThrow()
      expect(() => search(db, { query: '(' }, { capped: true })).not.toThrow()
      expect(() => search(db, { query: 'AND' }, { capped: true })).not.toThrow()
    })

    it('matches literally on a query containing a bare AND/OR/NOT word', () => {
      const match = seedEntry(db, { id: 'entry-1', content: 'cats and dogs' })

      const result = search(db, { query: 'and' }, { capped: true })

      expect(result.map((e) => e.id)).toEqual([match.id])
    })

    it('treats a punctuation-only query the same as no query', () => {
      seedEntry(db, { content: 'hello world' })

      const result = search(db, { query: '"()' }, { capped: true })

      expect(result).toEqual([])
    })
  })

  describe('tags-only search', () => {
    it('matches entries carrying every selected tag (AND intersection)', () => {
      const entryId = seedEntry(db, { id: 'entry-1' }).id
      const otherId = seedEntry(db, { id: 'entry-2' }).id
      const tagA = seedTag(db, { id: 'tag-a', name: 'a' })
      const tagB = seedTag(db, { id: 'tag-b', name: 'b' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: tagA.id })
      seedEntryTag(db, { id: 'et-2', entryId, tagId: tagB.id })
      seedEntryTag(db, { id: 'et-3', entryId: otherId, tagId: tagA.id })

      const result = search(
        db,
        { tagIds: [tagA.id, tagB.id] },
        { capped: true }
      )

      expect(result.map((e) => e.id)).toEqual([entryId])
    })

    it('deduplicates repeated tagIds instead of excluding matching entries', () => {
      const entryId = seedEntry(db, { id: 'entry-1' }).id
      const tag = seedTag(db, { id: 'tag-a' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: tag.id })

      const result = search(db, { tagIds: [tag.id, tag.id] }, { capped: true })

      expect(result.map((e) => e.id)).toEqual([entryId])
    })

    it('excludes soft-deleted entries', () => {
      const entryId = seedEntry(db, { id: 'entry-1', isDeleted: true }).id
      const tag = seedTag(db, { id: 'tag-a' })
      seedEntryTag(db, { id: 'et-1', entryId, tagId: tag.id })

      const result = search(db, { tagIds: [tag.id] }, { capped: true })

      expect(result).toEqual([])
    })
  })

  describe('combined text + tag search (AND across both dimensions)', () => {
    it('requires both the text match and every selected tag', () => {
      const bothId = seedEntry(db, {
        id: 'entry-both',
        content: 'went running today'
      }).id
      const textOnlyId = seedEntry(db, {
        id: 'entry-text-only',
        content: 'went running yesterday'
      }).id
      const tagOnlyId = seedEntry(db, {
        id: 'entry-tag-only',
        content: 'ate breakfast'
      }).id
      const tag = seedTag(db, { id: 'tag-a' })
      seedEntryTag(db, { id: 'et-1', entryId: bothId, tagId: tag.id })
      seedEntryTag(db, { id: 'et-2', entryId: tagOnlyId, tagId: tag.id })
      // textOnlyId intentionally has no tag association

      const result = search(
        db,
        { query: 'run', tagIds: [tag.id] },
        { capped: true }
      )

      expect(result.map((e) => e.id)).toEqual([bothId])
      expect(result.map((e) => e.id)).not.toContain(textOnlyId)
    })
  })

  describe('ordering and capping', () => {
    it('orders results by assigned_day DESC, id ASC', () => {
      seedEntry(db, { id: 'b', content: 'run', assignedDay: '2022-01-05' })
      seedEntry(db, { id: 'a', content: 'run', assignedDay: '2022-01-10' })
      seedEntry(db, { id: 'd', content: 'run', assignedDay: '2022-01-10' })
      seedEntry(db, { id: 'c', content: 'run', assignedDay: '2022-01-10' })

      const result = search(db, { query: 'run' }, { capped: true })

      expect(result.map((e) => e.id)).toEqual(['a', 'c', 'd', 'b'])
    })

    it('limits to 20 results when capped is true', () => {
      for (let i = 0; i < 25; i++) {
        seedEntry(db, {
          id: `entry-${String(i)}`,
          content: 'run',
          assignedDay: '2022-01-01'
        })
      }

      const result = search(db, { query: 'run' }, { capped: true })

      expect(result).toHaveLength(20)
    })

    it('returns every match when capped is false', () => {
      for (let i = 0; i < 25; i++) {
        seedEntry(db, {
          id: `entry-${String(i)}`,
          content: 'run',
          assignedDay: '2022-01-01'
        })
      }

      const result = search(db, { query: 'run' }, { capped: false })

      expect(result).toHaveLength(25)
    })

    it('capped and uncapped runs agree on entry order, differing only in count', () => {
      for (let i = 0; i < 25; i++) {
        seedEntry(db, {
          id: `entry-${String(i).padStart(2, '0')}`,
          content: 'run',
          assignedDay: '2022-01-01'
        })
      }

      const capped = search(db, { query: 'run' }, { capped: true })
      const uncapped = search(db, { query: 'run' }, { capped: false })

      expect(capped.map((e) => e.id)).toEqual(
        uncapped.slice(0, 20).map((e) => e.id)
      )
    })
  })
})

describe('findDayCounts', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForSearch()
  })

  describe('neither filter present', () => {
    it('returns unfiltered per-day counts for the month', () => {
      seedEntry(db, { id: 'a', assignedDay: '2022-03-05' })
      seedEntry(db, { id: 'b', assignedDay: '2022-03-05' })
      seedEntry(db, { id: 'c', assignedDay: '2022-03-10' })

      const result = findDayCounts(db, {}, '2022-03')

      expect(result).toEqual([
        { assignedDay: '2022-03-05', count: 2 },
        { assignedDay: '2022-03-10', count: 1 }
      ])
    })

    it('excludes soft-deleted entries', () => {
      seedEntry(db, { id: 'a', assignedDay: '2022-03-05', isDeleted: true })

      const result = findDayCounts(db, {}, '2022-03')

      expect(result).toEqual([])
    })

    it('excludes entries outside the requested month', () => {
      seedEntry(db, { id: 'a', assignedDay: '2022-02-28' })
      seedEntry(db, { id: 'b', assignedDay: '2022-04-01' })
      seedEntry(db, { id: 'c', assignedDay: '2022-03-15' })

      const result = findDayCounts(db, {}, '2022-03')

      expect(result).toEqual([{ assignedDay: '2022-03-15', count: 1 }])
    })
  })

  describe('text-only filter', () => {
    it('counts only matching entries per day', () => {
      seedEntry(db, {
        id: 'a',
        assignedDay: '2022-03-05',
        content: 'went running'
      })
      seedEntry(db, {
        id: 'b',
        assignedDay: '2022-03-05',
        content: 'ate breakfast'
      })

      const result = findDayCounts(db, { query: 'run' }, '2022-03')

      expect(result).toEqual([{ assignedDay: '2022-03-05', count: 1 }])
    })
  })

  describe('tags-only filter', () => {
    it('counts only entries carrying every selected tag', () => {
      const bothId = seedEntry(db, {
        id: 'entry-both',
        assignedDay: '2022-03-05'
      }).id
      const oneId = seedEntry(db, {
        id: 'entry-one',
        assignedDay: '2022-03-05'
      }).id
      const tagA = seedTag(db, { id: 'tag-a', name: 'a' })
      const tagB = seedTag(db, { id: 'tag-b', name: 'b' })
      seedEntryTag(db, { id: 'et-1', entryId: bothId, tagId: tagA.id })
      seedEntryTag(db, { id: 'et-2', entryId: bothId, tagId: tagB.id })
      seedEntryTag(db, { id: 'et-3', entryId: oneId, tagId: tagA.id })

      const result = findDayCounts(
        db,
        { tagIds: [tagA.id, tagB.id] },
        '2022-03'
      )

      expect(result).toEqual([{ assignedDay: '2022-03-05', count: 1 }])
    })

    it('does not let two different entries on the same day, each with one different selected tag, wrongly count that day', () => {
      const entryOnlyA = seedEntry(db, {
        id: 'entry-only-a',
        assignedDay: '2022-03-05'
      }).id
      const entryOnlyB = seedEntry(db, {
        id: 'entry-only-b',
        assignedDay: '2022-03-05'
      }).id
      const tagA = seedTag(db, { id: 'tag-a', name: 'a' })
      const tagB = seedTag(db, { id: 'tag-b', name: 'b' })
      seedEntryTag(db, { id: 'et-1', entryId: entryOnlyA, tagId: tagA.id })
      seedEntryTag(db, { id: 'et-2', entryId: entryOnlyB, tagId: tagB.id })

      const result = findDayCounts(
        db,
        { tagIds: [tagA.id, tagB.id] },
        '2022-03'
      )

      expect(result).toEqual([])
    })
  })

  describe('combined text + tag filter', () => {
    it('requires both the text match and every selected tag', () => {
      const bothId = seedEntry(db, {
        id: 'entry-both',
        assignedDay: '2022-03-05',
        content: 'went running'
      }).id
      const textOnlyId = seedEntry(db, {
        id: 'entry-text-only',
        assignedDay: '2022-03-05',
        content: 'went running yesterday'
      }).id
      const tag = seedTag(db, { id: 'tag-a' })
      seedEntryTag(db, { id: 'et-1', entryId: bothId, tagId: tag.id })

      const result = findDayCounts(
        db,
        { query: 'run', tagIds: [tag.id] },
        '2022-03'
      )

      expect(result).toEqual([{ assignedDay: '2022-03-05', count: 1 }])
      expect(textOnlyId).not.toBe(bothId)
    })
  })
})
