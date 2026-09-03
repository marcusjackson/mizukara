/**
 * Tests for the device sync tag dedupe pass
 */

import {
  createTestDatabaseForEntries,
  seedEntry,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it } from 'vitest'

import { dedupeActiveTags } from './device-sync-tag-dedupe'

import type { Database } from 'sql.js'

/** Drop the migration-003 unique index so tests can seed a colliding pre-dedupe state directly. */
function dropTagsNameUniqueIndex(db: Database): void {
  db.run('DROP INDEX IF EXISTS idx_tags_name_active_unique')
}

function activeTagIds(db: Database): string[] {
  const result = db.exec(
    'SELECT id FROM tags WHERE is_deleted = 0 ORDER BY id ASC'
  )
  return (result[0]?.values ?? []).map((row) => row[0] as string)
}

function activeEntryTagPairs(db: Database): [string, string][] {
  const result = db.exec(
    'SELECT entry_id, tag_id FROM entry_tags WHERE is_deleted = 0 ORDER BY id ASC'
  )
  return (result[0]?.values ?? []).map(
    (row) => [row[0], row[1]] as [string, string]
  )
}

describe('device-sync-tag-dedupe', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()
    dropTagsNameUniqueIndex(db)
  })

  it('does nothing when no active tag names collide', () => {
    seedTag(db, { id: 'a', name: 'work' })
    seedTag(db, { id: 'b', name: 'personal' })

    dedupeActiveTags(db)

    expect(activeTagIds(db)).toEqual(['a', 'b'])
  })

  it('keeps the lexicographically smallest id and soft-deletes the rest for a case-insensitive collision', () => {
    seedTag(db, { id: 'bbbb', name: 'Work' })
    seedTag(db, { id: 'aaaa', name: 'work' })

    dedupeActiveTags(db)

    expect(activeTagIds(db)).toEqual(['aaaa'])

    const loser = db.exec('SELECT is_deleted FROM tags WHERE id = ?', ['bbbb'])
    expect(loser[0]?.values[0]).toEqual([1])
  })

  it('resolves a three-way collision down to a single survivor', () => {
    seedTag(db, { id: 'c', name: 'WORK' })
    seedTag(db, { id: 'a', name: 'work' })
    seedTag(db, { id: 'b', name: 'Work' })

    dedupeActiveTags(db)

    expect(activeTagIds(db)).toEqual(['a'])
  })

  it('does not touch already soft-deleted tags with a colliding name', () => {
    seedTag(db, { id: 'a', name: 'work', isDeleted: true })
    seedTag(db, { id: 'b', name: 'work' })

    dedupeActiveTags(db)

    expect(activeTagIds(db)).toEqual(['b'])
  })

  it('repoints entry_tags rows referencing a soft-deleted loser to the survivor', () => {
    seedTag(db, { id: 'bbbb', name: 'Work' })
    seedTag(db, { id: 'aaaa', name: 'work' })
    const entryId = seedEntry(db).id
    seedEntryTag(db, { entryId, tagId: 'bbbb' })

    dedupeActiveTags(db)

    expect(activeEntryTagPairs(db)).toEqual([[entryId, 'aaaa']])
  })

  it('soft-deletes the entry_tags duplicate that repointing produces, keeping the smallest id', () => {
    seedTag(db, { id: 'bbbb', name: 'Work' })
    seedTag(db, { id: 'aaaa', name: 'work' })
    const entryId = seedEntry(db).id
    // Entry already tagged with the eventual survivor...
    seedEntryTag(db, { id: 'et-2', entryId, tagId: 'aaaa' })
    // ...and separately tagged with the eventual loser — repointing this
    // one onto 'aaaa' would duplicate the pair above.
    seedEntryTag(db, { id: 'et-1', entryId, tagId: 'bbbb' })

    dedupeActiveTags(db)

    const pairs = activeEntryTagPairs(db)
    expect(pairs).toEqual([[entryId, 'aaaa']])

    // The smaller-id entry_tags row survives; the other is soft-deleted.
    const survivor = db.exec('SELECT is_deleted FROM entry_tags WHERE id = ?', [
      'et-1'
    ])
    expect(survivor[0]?.values[0]).toEqual([0])
    const deduped = db.exec('SELECT is_deleted FROM entry_tags WHERE id = ?', [
      'et-2'
    ])
    expect(deduped[0]?.values[0]).toEqual([1])
  })

  it('never leaves an entry_tags row pointing at a soft-deleted tag', () => {
    seedTag(db, { id: 'bbbb', name: 'Work' })
    seedTag(db, { id: 'aaaa', name: 'work' })
    const entryId1 = seedEntry(db, { assignedDay: '2022-01-01' }).id
    const entryId2 = seedEntry(db, { assignedDay: '2022-01-02' }).id
    seedEntryTag(db, { entryId: entryId1, tagId: 'bbbb' })
    seedEntryTag(db, { entryId: entryId2, tagId: 'bbbb' })

    dedupeActiveTags(db)

    const orphaned = db.exec(
      `SELECT entry_tags.id FROM entry_tags
       JOIN tags ON tags.id = entry_tags.tag_id
       WHERE entry_tags.is_deleted = 0 AND tags.is_deleted = 1`
    )
    expect(orphaned).toEqual([])
  })

  it('is idempotent — running it again after resolving a collision changes nothing further', () => {
    seedTag(db, { id: 'bbbb', name: 'Work' })
    seedTag(db, { id: 'aaaa', name: 'work' })

    dedupeActiveTags(db)
    const afterFirstRun = activeTagIds(db)

    dedupeActiveTags(db)
    expect(activeTagIds(db)).toEqual(afterFirstRun)
  })
})
