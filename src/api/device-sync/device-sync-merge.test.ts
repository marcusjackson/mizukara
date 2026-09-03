/**
 * Tests for the device sync merge engine
 */

import {
  createTestDatabaseForEntries,
  seedEntry,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { schedulePersist } from '@/db/indexeddb'

import { applySyncPayload } from './device-sync-merge'

import type {
  SyncEntryRow,
  SyncEntryTagRow,
  SyncTagRow
} from '@/shared/types/device-sync-payload-types'
import type { BindParams, Database } from 'sql.js'

vi.mock('@/db/indexeddb', () => ({
  schedulePersist: vi.fn()
}))

function remoteEntry(overrides: Partial<SyncEntryRow> = {}): SyncEntryRow {
  return {
    id: 'remote-entry-1',
    content: 'remote content',
    created_at: 100,
    updated_at: 100,
    assigned_day: '2022-01-01',
    order_position: 0,
    is_deleted: 0,
    ...overrides
  }
}

function remoteTag(overrides: Partial<SyncTagRow> = {}): SyncTagRow {
  return {
    id: 'remote-tag-1',
    name: 'remote-tag',
    created_at: 100,
    updated_at: 100,
    is_deleted: 0,
    ...overrides
  }
}

function remoteEntryTag(
  overrides: Partial<SyncEntryTagRow> = {}
): SyncEntryTagRow {
  return {
    id: 'remote-entry-tag-1',
    entry_id: 'remote-entry-1',
    tag_id: 'remote-tag-1',
    created_at: 100,
    updated_at: 100,
    is_deleted: 0,
    ...overrides
  }
}

const emptyPayload = { entries: [], tags: [], entry_tags: [] }

describe('device-sync-merge', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()
    vi.clearAllMocks()
  })

  describe('applySyncPayload — entries', () => {
    it('inserts a remote-only row', () => {
      const remote = remoteEntry({ id: 'new-1' })

      applySyncPayload(db, { ...emptyPayload, entries: [remote] })

      const result = db.exec('SELECT content FROM entries WHERE id = ?', [
        'new-1'
      ])
      expect(result[0]?.values[0]).toEqual(['remote content'])
    })

    it('overwrites the local row when the remote row is strictly newer', () => {
      const local = seedEntry(db, {
        content: 'local',
        updatedAt: 100
      })

      applySyncPayload(db, {
        ...emptyPayload,
        entries: [
          remoteEntry({
            id: local.id,
            content: 'remote wins',
            updated_at: 200
          })
        ]
      })

      const result = db.exec('SELECT content FROM entries WHERE id = ?', [
        local.id
      ])
      expect(result[0]?.values[0]).toEqual(['remote wins'])
    })

    it('keeps the local row when the remote row is older', () => {
      const local = seedEntry(db, { content: 'local', updatedAt: 200 })

      applySyncPayload(db, {
        ...emptyPayload,
        entries: [
          remoteEntry({
            id: local.id,
            content: 'stale remote',
            updated_at: 100
          })
        ]
      })

      const result = db.exec('SELECT content FROM entries WHERE id = ?', [
        local.id
      ])
      expect(result[0]?.values[0]).toEqual(['local'])
    })

    it('keeps the local row on a timestamp tie (local wins on a tie)', () => {
      const local = seedEntry(db, { content: 'local', updatedAt: 150 })

      applySyncPayload(db, {
        ...emptyPayload,
        entries: [
          remoteEntry({ id: local.id, content: 'remote tie', updated_at: 150 })
        ]
      })

      const result = db.exec('SELECT content FROM entries WHERE id = ?', [
        local.id
      ])
      expect(result[0]?.values[0]).toEqual(['local'])
    })

    it('propagates a soft-delete when it is genuinely newer', () => {
      const local = seedEntry(db, { isDeleted: false, updatedAt: 100 })

      applySyncPayload(db, {
        ...emptyPayload,
        entries: [remoteEntry({ id: local.id, is_deleted: 1, updated_at: 200 })]
      })

      const result = db.exec('SELECT is_deleted FROM entries WHERE id = ?', [
        local.id
      ])
      expect(result[0]?.values[0]).toEqual([1])
    })

    it('does not resurrect a row soft-deleted by a change the other device has not seen yet', () => {
      const local = seedEntry(db, { isDeleted: true, updatedAt: 200 })

      applySyncPayload(db, {
        ...emptyPayload,
        entries: [remoteEntry({ id: local.id, is_deleted: 0, updated_at: 100 })]
      })

      const result = db.exec('SELECT is_deleted FROM entries WHERE id = ?', [
        local.id
      ])
      expect(result[0]?.values[0]).toEqual([1])
    })

    it('un-deletes a row when a genuinely later edit undeleted it remotely', () => {
      const local = seedEntry(db, { isDeleted: true, updatedAt: 100 })

      applySyncPayload(db, {
        ...emptyPayload,
        entries: [remoteEntry({ id: local.id, is_deleted: 0, updated_at: 200 })]
      })

      const result = db.exec('SELECT is_deleted FROM entries WHERE id = ?', [
        local.id
      ])
      expect(result[0]?.values[0]).toEqual([0])
    })
  })

  describe('applySyncPayload — entry_tags', () => {
    it('upserts entry_tags rows by id using the same LWW rule', () => {
      const entryId = seedEntry(db).id
      const tagId = seedTag(db).id
      const local = seedEntryTag(db, {
        entryId,
        tagId,
        isDeleted: false,
        updatedAt: 100
      })

      applySyncPayload(db, {
        ...emptyPayload,
        entry_tags: [
          remoteEntryTag({
            id: local.id,
            entry_id: entryId,
            tag_id: tagId,
            is_deleted: 1,
            updated_at: 200
          })
        ]
      })

      const result = db.exec('SELECT is_deleted FROM entry_tags WHERE id = ?', [
        local.id
      ])
      expect(result[0]?.values[0]).toEqual([1])
    })
  })

  describe('atomicity', () => {
    it('rolls back the whole table if a row partway through the batch fails', () => {
      const rowA = remoteEntry({ id: 'row-a' })
      const rowB = remoteEntry({ id: 'row-b' })

      const originalRun = db.run.bind(db)
      const runSpy = vi
        .spyOn(db, 'run')
        .mockImplementation((sql: string, params?: BindParams) => {
          if (
            sql.startsWith('INSERT INTO entries') &&
            Array.isArray(params) &&
            params[0] === 'row-b'
          ) {
            throw new Error('simulated failure')
          }
          return originalRun(sql, params)
        })

      expect(() => {
        applySyncPayload(db, { ...emptyPayload, entries: [rowA, rowB] })
      }).toThrow('simulated failure')

      runSpy.mockRestore()

      const result = db.exec('SELECT id FROM entries WHERE id = ?', ['row-a'])
      expect(result).toEqual([])
    })
  })

  describe('persistence', () => {
    it('schedules a fast-path persist after a successful merge', () => {
      applySyncPayload(db, emptyPayload)
      expect(schedulePersist).toHaveBeenCalledTimes(1)
    })

    it('does not schedule a persist when the merge throws', () => {
      const runSpy = vi.spyOn(db, 'run').mockImplementation(() => {
        throw new Error('simulated failure')
      })

      expect(() => {
        applySyncPayload(db, { ...emptyPayload, entries: [remoteEntry()] })
      }).toThrow()

      runSpy.mockRestore()
      expect(schedulePersist).not.toHaveBeenCalled()
    })
  })

  describe('tag-name collision (integration with dedupe)', () => {
    it('converges to a single active tag and repoints entry_tags on a merge-introduced name collision', () => {
      const localTag = seedTag(db, { id: 'aaaa', name: 'Work' })
      const entryId = seedEntry(db).id
      seedEntryTag(db, { entryId, tagId: localTag.id })

      applySyncPayload(db, {
        entries: [],
        tags: [remoteTag({ id: 'bbbb', name: 'work' })],
        entry_tags: [
          remoteEntryTag({
            id: 'remote-et',
            entry_id: entryId,
            tag_id: 'bbbb'
          })
        ]
      })

      const activeTags = db.exec('SELECT id FROM tags WHERE is_deleted = 0')
      expect(activeTags[0]?.values).toEqual([['aaaa']])

      const activeEntryTags = db.exec(
        'SELECT tag_id FROM entry_tags WHERE entry_id = ? AND is_deleted = 0',
        [entryId]
      )
      expect(activeEntryTags[0]?.values).toEqual([['aaaa']])
    })

    it('still enforces the active-tag-name unique index after applySyncPayload completes', () => {
      applySyncPayload(db, emptyPayload)

      db.run(
        `INSERT INTO tags (id, name, created_at, updated_at, is_deleted) VALUES ('x1', 'dup', 1, 1, 0)`
      )
      expect(() =>
        db.run(
          `INSERT INTO tags (id, name, created_at, updated_at, is_deleted) VALUES ('x2', 'DUP', 2, 2, 0)`
        )
      ).toThrow()
    })
  })
})
