/**
 * Tests for device sync serialization
 */

import {
  createTestDatabaseForEntries,
  seedEntry,
  seedEntryTag,
  seedTag
} from '@test/helpers/database'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  DeviceSyncPayloadError,
  parseSyncPayloadJSON,
  serializeDatabase,
  serializeDatabaseToJSON,
  validateSyncPayload
} from './device-sync-serialize'

import type { Database } from 'sql.js'

describe('device-sync-serialize', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabaseForEntries()
  })

  describe('serializeDatabase', () => {
    it('returns empty arrays for an empty database', () => {
      const payload = serializeDatabase(db)
      expect(payload).toEqual({ entries: [], tags: [], entry_tags: [] })
    })

    it('serializes entries keyed by column name', () => {
      const entry = seedEntry(db, {
        content: 'Hello',
        assignedDay: '2022-01-01'
      })

      const payload = serializeDatabase(db)

      expect(payload.entries).toEqual([
        {
          id: entry.id,
          content: 'Hello',
          created_at: entry.createdAt,
          updated_at: entry.updatedAt,
          assigned_day: '2022-01-01',
          order_position: entry.orderPosition,
          is_deleted: 0
        }
      ])
    })

    it('includes soft-deleted rows', () => {
      seedEntry(db, { isDeleted: true })

      const payload = serializeDatabase(db)

      expect(payload.entries).toHaveLength(1)
      expect(payload.entries[0]?.is_deleted).toBe(1)
    })

    it('serializes tags and entry_tags keyed by column name', () => {
      const entryId = seedEntry(db).id
      const tag = seedTag(db, { name: 'work' })
      const entryTag = seedEntryTag(db, { entryId, tagId: tag.id })

      const payload = serializeDatabase(db)

      expect(payload.tags).toEqual([
        {
          id: tag.id,
          name: 'work',
          created_at: tag.createdAt,
          updated_at: tag.updatedAt,
          is_deleted: 0
        }
      ])
      expect(payload.entry_tags).toEqual([
        {
          id: entryTag.id,
          entry_id: entryId,
          tag_id: tag.id,
          created_at: entryTag.createdAt,
          updated_at: entryTag.updatedAt,
          is_deleted: 0
        }
      ])
    })
  })

  describe('serializeDatabaseToJSON / parseSyncPayloadJSON round trip', () => {
    it('round-trips a populated database', () => {
      const entryId = seedEntry(db).id
      const tag = seedTag(db)
      seedEntryTag(db, { entryId, tagId: tag.id })

      const json = serializeDatabaseToJSON(db)
      const parsed = parseSyncPayloadJSON(json)

      expect(parsed).toEqual(serializeDatabase(db))
    })

    it('throws DeviceSyncPayloadError on malformed JSON', () => {
      expect(() => parseSyncPayloadJSON('{not json')).toThrow(
        DeviceSyncPayloadError
      )
    })
  })

  describe('validateSyncPayload', () => {
    const validPayload = {
      entries: [],
      tags: [],
      entry_tags: []
    }

    it('accepts a well-formed empty payload', () => {
      expect(validateSyncPayload(validPayload)).toEqual(validPayload)
    })

    it('accepts a well-formed populated payload', () => {
      const payload = {
        entries: [
          {
            id: 'e1',
            content: 'hi',
            created_at: 1,
            updated_at: 1,
            assigned_day: '2022-01-01',
            order_position: 0,
            is_deleted: 0
          }
        ],
        tags: [
          {
            id: 't1',
            name: 'work',
            created_at: 1,
            updated_at: 1,
            is_deleted: 0
          }
        ],
        entry_tags: [
          {
            id: 'et1',
            entry_id: 'e1',
            tag_id: 't1',
            created_at: 1,
            updated_at: 1,
            is_deleted: 0
          }
        ]
      }

      expect(validateSyncPayload(payload)).toEqual(payload)
    })

    it.each([null, undefined, 'string', 42, []])(
      'rejects a non-object top-level value: %p',
      (value) => {
        expect(() => validateSyncPayload(value)).toThrow(DeviceSyncPayloadError)
      }
    )

    it('rejects a payload missing a table key', () => {
      expect(() => validateSyncPayload({ entries: [], tags: [] })).toThrow(
        DeviceSyncPayloadError
      )
    })

    it('rejects a payload where a table is not an array', () => {
      expect(() =>
        validateSyncPayload({ entries: {}, tags: [], entry_tags: [] })
      ).toThrow(DeviceSyncPayloadError)
    })

    it('rejects a row that is not an object', () => {
      expect(() =>
        validateSyncPayload({ entries: ['nope'], tags: [], entry_tags: [] })
      ).toThrow(DeviceSyncPayloadError)
    })

    it('rejects a row missing a required field', () => {
      expect(() =>
        validateSyncPayload({
          entries: [{ id: 'e1', content: 'hi' }],
          tags: [],
          entry_tags: []
        })
      ).toThrow(DeviceSyncPayloadError)
    })

    it('rejects a row with a field of the wrong type', () => {
      expect(() =>
        validateSyncPayload({
          entries: [],
          tags: [
            {
              id: 't1',
              name: 'work',
              created_at: '1',
              updated_at: 1,
              is_deleted: 0
            }
          ],
          entry_tags: []
        })
      ).toThrow(DeviceSyncPayloadError)
    })
  })
})
