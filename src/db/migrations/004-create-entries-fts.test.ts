/**
 * Tests for 004-create-entries-fts migration
 */

import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'

import migration001 from './001-create-entries.sql?raw'
import migration002 from './002-create-tags.sql?raw'
import migration003 from './003-tags-name-unique-index.sql?raw'
import { runMigrations } from './index'

import type { Database } from 'sql.js'

function insertEntry(
  db: Database,
  id: string,
  content: string,
  assignedDay = '2022-01-01'
): void {
  const now = Date.now()
  db.run(
    `INSERT INTO entries (id, content, created_at, updated_at, assigned_day, order_position, is_deleted)
     VALUES (?, ?, ?, ?, ?, 0, 0)`,
    [id, content, now, now, assignedDay]
  )
}

describe('004-create-entries-fts migration', () => {
  it('creates the entries_fts virtual table', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const tableResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='entries_fts'
    `)
    expect(tableResult[0]?.values).toHaveLength(1)
  })

  it('sets schema version to 4', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    const versionResult = db.exec('PRAGMA user_version')
    expect(versionResult[0]?.values[0]?.[0]).toBe(4)
  })

  it('backfills existing entries into entries_fts', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    // Apply only migrations 1-3 first, so an entry exists before migration 4
    // (and its sync triggers) run
    db.exec(migration001)
    db.exec(migration002)
    db.exec(migration003)
    insertEntry(db, 'entry-1', 'backfilled content')

    runMigrations(db)

    const result = db.exec(
      `SELECT id, content FROM entries_fts WHERE id = 'entry-1'`
    )
    expect(result[0]?.values[0]).toEqual(['entry-1', 'backfilled content'])
  })

  it('inserting into entries mirrors the row into entries_fts', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    insertEntry(db, 'entry-2', 'hello world')

    const result = db.exec(
      `SELECT id, content FROM entries_fts WHERE id = 'entry-2'`
    )
    expect(result[0]?.values[0]).toEqual(['entry-2', 'hello world'])
  })

  it('updating entries.content updates the mirrored entries_fts row', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    insertEntry(db, 'entry-3', 'original content')

    db.run(`UPDATE entries SET content = ? WHERE id = ?`, [
      'updated content',
      'entry-3'
    ])

    const result = db.exec(
      `SELECT content FROM entries_fts WHERE id = 'entry-3'`
    )
    expect(result[0]?.values[0]).toEqual(['updated content'])
  })

  it('deleting a row from entries removes it from entries_fts', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    insertEntry(db, 'entry-4', 'to be removed')

    db.run(`DELETE FROM entries WHERE id = ?`, ['entry-4'])

    const result = db.exec(`SELECT id FROM entries_fts WHERE id = 'entry-4'`)
    expect(result[0]?.values ?? []).toHaveLength(0)
  })

  it('mirrors soft-deleted rows too (is_deleted is not consulted by triggers)', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    insertEntry(db, 'entry-5', 'soft deleted content')
    db.run(`UPDATE entries SET is_deleted = 1 WHERE id = ?`, ['entry-5'])

    const result = db.exec(`SELECT id FROM entries_fts WHERE id = 'entry-5'`)
    expect(result[0]?.values).toHaveLength(1)
  })

  it('supports MATCH queries against porter-tokenized content', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    insertEntry(db, 'entry-6', 'running quickly through the park')

    // Porter stemming should match "run" against "running"
    const result = db.exec(
      `SELECT id FROM entries_fts WHERE content MATCH 'run'`
    )
    expect(result[0]?.values.map((row) => row[0])).toContain('entry-6')
  })

  it('is idempotent (safe to re-run)', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)
    runMigrations(db)

    const tableResult = db.exec(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='entries_fts'
    `)
    expect(tableResult[0]?.values).toHaveLength(1)
  })
})
