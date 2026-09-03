import { describe, expect, it } from 'vitest'

import { SYNC_TABLE_NAMES } from './device-sync-payload-types'

import type {
  SyncEntryRow,
  SyncEntryTagRow,
  SyncPayload,
  SyncTagRow
} from './device-sync-payload-types'

describe('Device Sync Payload Types', () => {
  it('lists all three synced tables in merge-application order', () => {
    expect(SYNC_TABLE_NAMES).toEqual(['entries', 'tags', 'entry_tags'])
  })

  it('should define SyncEntryRow keyed by column name', () => {
    const row: SyncEntryRow = {
      id: 'e1',
      content: 'hello',
      created_at: 1,
      updated_at: 2,
      assigned_day: '2022-01-01',
      order_position: 0,
      is_deleted: 0
    }

    expect(row.assigned_day).toBe('2022-01-01')
    expect(row.is_deleted).toBe(0)
  })

  it('should define SyncTagRow keyed by column name', () => {
    const row: SyncTagRow = {
      id: 't1',
      name: 'work',
      created_at: 1,
      updated_at: 2,
      is_deleted: 0
    }

    expect(row.name).toBe('work')
  })

  it('should define SyncEntryTagRow keyed by column name', () => {
    const row: SyncEntryTagRow = {
      id: 'et1',
      entry_id: 'e1',
      tag_id: 't1',
      created_at: 1,
      updated_at: 2,
      is_deleted: 0
    }

    expect(row.entry_id).toBe('e1')
    expect(row.tag_id).toBe('t1')
  })

  it('should define SyncPayload as all three tables together', () => {
    const payload: SyncPayload = { entries: [], tags: [], entry_tags: [] }

    expect(payload).toEqual({ entries: [], tags: [], entry_tags: [] })
  })
})
