/**
 * Entry Seeding Functions for Test Helpers
 */

import initSqlJs from 'sql.js'

import {
  ENTRIES_SCHEMA_SQL,
  type Entry,
  rowToEntry,
  type SeedEntryInput
} from './schema'

import type { Database } from 'sql.js'

/**
 * Create a fresh in-memory test database with entries schema applied
 */
export async function createTestDatabaseForEntries(): Promise<Database> {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  db.run(ENTRIES_SCHEMA_SQL)
  return db
}

/**
 * Seed an entry into the test database with sensible defaults
 *
 * @param db - Database instance
 * @param data - Partial entry data (all fields optional with defaults)
 * @returns Seeded entry from database
 *
 * @throws {Error} If content is empty
 * @throws {Error} If assignedDay is not in YYYY-MM-DD format
 */
export function seedEntry(db: Database, data: SeedEntryInput = {}): Entry {
  const {
    assignedDay = '2022-01-01',
    content = 'Test entry content',
    id = crypto.randomUUID(),
    isDeleted = false,
    orderPosition = 0
  } = data

  // Minimal validation for test data quality
  if (!content.trim()) {
    throw new Error(
      `seedEntry: content cannot be empty (received: "${content}")`
    )
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(assignedDay)) {
    throw new Error(
      `seedEntry: assignedDay must be YYYY-MM-DD format (received: "${assignedDay}")`
    )
  }

  const now = Date.now()

  db.run(
    `INSERT INTO entries (id, content, created_at, updated_at, assigned_day, order_position, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, content, now, now, assignedDay, orderPosition, isDeleted ? 1 : 0]
  )

  const result = db.exec('SELECT * FROM entries WHERE id = ?', [id])
  const row = result[0]?.values[0]
  if (!row) {
    throw new Error(`seedEntry: Failed to insert entry with id "${id}"`)
  }

  return rowToEntry(row)
}
