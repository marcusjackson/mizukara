/**
 * Tests for 003-tags-name-unique-index migration
 */

import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'

import { runMigrations } from './index'

describe('003-tags-name-unique-index migration', () => {
  it('applies cleanly to a fresh database (version 0 → 3)', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const versionResult = db.exec('PRAGMA user_version')
    const version = versionResult[0]?.values[0]?.[0]
    expect(version).toBe(3)
  })

  it('creates the case-insensitive unique index on tags name', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const indexResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND name='idx_tags_name_active_unique'
    `)
    expect(indexResult[0]?.values).toHaveLength(1)
    expect(indexResult[0]?.values[0]?.[0]).toBe('idx_tags_name_active_unique')
  })

  it('enforces case-insensitive uniqueness for active tags', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const now = String(Date.now())
    db.exec(`
      INSERT INTO tags (id, name, created_at, updated_at, is_deleted)
      VALUES ('1', 'Work', ${now}, ${now}, 0)
    `)

    expect(() => {
      db.exec(`
        INSERT INTO tags (id, name, created_at, updated_at, is_deleted)
        VALUES ('2', 'work', ${now}, ${now}, 0)
      `)
    }).toThrow()
  })

  it('allows same name for soft-deleted and active tags', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const now = String(Date.now())
    db.exec(`
      INSERT INTO tags (id, name, created_at, updated_at, is_deleted)
      VALUES ('1', 'Work', ${now}, ${now}, 1)
    `)

    expect(() => {
      db.exec(`
        INSERT INTO tags (id, name, created_at, updated_at, is_deleted)
        VALUES ('2', 'work', ${now}, ${now}, 0)
      `)
    }).not.toThrow()
  })

  it('is idempotent (safe to re-run)', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    runMigrations(db)

    const indexResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND name='idx_tags_name_active_unique'
    `)
    expect(indexResult[0]?.values).toHaveLength(1)
  })
})
