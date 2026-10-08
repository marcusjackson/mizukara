/**
 * Tests for runMigrations version handling
 */

import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'

import { LATEST_SCHEMA_VERSION, runMigrations } from './index'

function readVersion(db: { exec: (sql: string) => { values: unknown[][] }[] }) {
  return db.exec('PRAGMA user_version')[0]?.values[0]?.[0]
}

describe('runMigrations', () => {
  it('brings a fresh database to the latest version', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()

    runMigrations(db)

    expect(readVersion(db)).toBe(LATEST_SCHEMA_VERSION)
  })

  it('refuses a database saved by a newer version and leaves it untouched', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()
    db.run(`PRAGMA user_version = ${String(LATEST_SCHEMA_VERSION + 1)}`)

    expect(() => {
      runMigrations(db)
    }).toThrow(/newer version of Mizukara/)
    expect(readVersion(db)).toBe(LATEST_SCHEMA_VERSION + 1)
  })

  it('accepts a database already at the latest version', async () => {
    const SQL = await initSqlJs()
    const db = new SQL.Database()
    runMigrations(db)

    expect(() => {
      runMigrations(db)
    }).not.toThrow()
  })
})
