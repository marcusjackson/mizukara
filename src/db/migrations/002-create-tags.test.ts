/**
 * Tests for 002-create-tags migration
 */

import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'

import { runMigrations } from './index'

describe('002-create-tags migration', () => {
  it('creates the tags table with correct schema', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const tableResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='tags'
    `)
    expect(tableResult[0]?.values).toHaveLength(1)
    expect(tableResult[0]?.values[0]?.[0]).toBe('tags')

    const columnResult = db.exec('PRAGMA table_info(tags)')
    const columns = columnResult[0]?.values ?? []
    const columnMap = new Map(columns.map((col: unknown[]) => [col[1], col]))

    expect(columnMap.has('id')).toBe(true)
    expect(columnMap.has('name')).toBe(true)
    expect(columnMap.has('created_at')).toBe(true)
    expect(columnMap.has('updated_at')).toBe(true)
    expect(columnMap.has('is_deleted')).toBe(true)
  })

  it('creates the entry_tags table with correct schema', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const tableResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='entry_tags'
    `)
    expect(tableResult[0]?.values).toHaveLength(1)
    expect(tableResult[0]?.values[0]?.[0]).toBe('entry_tags')

    const columnResult = db.exec('PRAGMA table_info(entry_tags)')
    const columns = columnResult[0]?.values ?? []
    const columnMap = new Map(columns.map((col: unknown[]) => [col[1], col]))

    expect(columnMap.has('id')).toBe(true)
    expect(columnMap.has('entry_id')).toBe(true)
    expect(columnMap.has('tag_id')).toBe(true)
    expect(columnMap.has('created_at')).toBe(true)
    expect(columnMap.has('updated_at')).toBe(true)
    expect(columnMap.has('is_deleted')).toBe(true)
  })

  it('creates all three required indexes', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const indexResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND name IN (
        'idx_tags_name',
        'idx_entry_tags_entry_id',
        'idx_entry_tags_tag_id'
      )
    `)
    const indexes = (indexResult[0]?.values ?? []).flat()
    expect(indexes).toContain('idx_tags_name')
    expect(indexes).toContain('idx_entry_tags_entry_id')
    expect(indexes).toContain('idx_entry_tags_tag_id')
  })

  it('is idempotent (safe to re-run)', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    runMigrations(db)

    const tableResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name IN ('tags', 'entry_tags')
      ORDER BY name
    `)
    expect(tableResult[0]?.values).toHaveLength(2)
  })
})
