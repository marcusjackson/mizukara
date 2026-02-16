/**
 * Tests for 001-create-entries migration
 */

import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'

import { runMigrations } from './index'

describe('001-create-entries migration', () => {
  it('creates entries table with correct schema', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    // Check table exists
    const tableResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='entries'
    `)
    expect(tableResult[0]?.values).toHaveLength(1)
    expect(tableResult[0]?.values[0]?.[0]).toBe('entries')

    // Check columns
    const columnResult = db.exec(`
      PRAGMA table_info(entries)
    `)
    const columns = columnResult[0]?.values ?? []
    expect(columns).toHaveLength(7)

    // Verify each column
    const columnMap = new Map(columns.map((col: any[]) => [col[1], col]))

    expect(columnMap.get('id')).toEqual([0, 'id', 'TEXT', 0, null, 1])
    expect(columnMap.get('content')).toEqual([1, 'content', 'TEXT', 1, null, 0])
    expect(columnMap.get('created_at')).toEqual([
      2,
      'created_at',
      'INTEGER',
      1,
      null,
      0
    ])
    expect(columnMap.get('updated_at')).toEqual([
      3,
      'updated_at',
      'INTEGER',
      1,
      null,
      0
    ])
    expect(columnMap.get('assigned_day')).toEqual([
      4,
      'assigned_day',
      'TEXT',
      1,
      null,
      0
    ])
    expect(columnMap.get('order_position')).toEqual([
      5,
      'order_position',
      'INTEGER',
      1,
      '0',
      0
    ])
    expect(columnMap.get('is_deleted')).toEqual([
      6,
      'is_deleted',
      'INTEGER',
      1,
      '0',
      0
    ])
  })

  it('creates required indexes', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    // Check indexes exist
    const indexResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND name IN ('idx_entries_assigned_day', 'idx_entries_is_deleted')
    `)
    const indexes = (indexResult[0]?.values ?? []).flat()
    expect(indexes).toContain('idx_entries_assigned_day')
    expect(indexes).toContain('idx_entries_is_deleted')
  })

  it('is idempotent (safe to re-run)', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    // Run migration twice
    runMigrations(db)
    runMigrations(db)

    // Should still work
    const tableResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='entries'
    `)
    expect(tableResult[0]?.values).toHaveLength(1)
  })
})
