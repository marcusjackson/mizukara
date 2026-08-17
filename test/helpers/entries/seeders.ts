/**
 * Entry Seeding Functions for Test Helpers
 */

import initSqlJs from 'sql.js'

import { buildColumnMap, rowToEntry } from '@/api/entries/entry-helpers'

import { runMigrations } from '@/db/migrations'

import type { Entry, SeedEntryInput } from './schema'
import type { Database } from 'sql.js'

/**
 * Create a fresh in-memory test database with the production schema applied.
 *
 * Uses runMigrations from the production migration runner so test and production
 * schemas stay automatically in sync — no manual duplication needed.
 */
export async function createTestDatabaseForEntries(): Promise<Database> {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  runMigrations(db)
  return db
}

/**
 * Validates that a YYYY-MM-DD string represents a real calendar date by
 * constructing a UTC Date and confirming the components round-trip exactly.
 *
 * This is necessary because V8's Date.parse silently rolls over invalid dates
 * (e.g. 2022-02-30 → 2022-03-02) instead of returning NaN.
 */
function isCalendarValidDate(dateStr: string): boolean {
  const parts = dateStr.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 0
  const day = parts[2] ?? 0
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  )
}

/**
 * Seed an entry into the test database with sensible defaults
 *
 * @param db - Database instance
 * @param data - Partial entry data (all fields optional with defaults)
 * @returns Seeded entry from database
 *
 * @throws {Error} If content is empty
 * @throws {Error} If assignedDay is not in YYYY-MM-DD format with valid month/day
 */
export function seedEntry(db: Database, data: SeedEntryInput = {}): Entry {
  const {
    assignedDay = '2022-01-01',
    content = 'Test entry content',
    id = crypto.randomUUID(),
    isDeleted = false
  } = data

  // Minimal validation for test data quality
  if (!content.trim()) {
    throw new Error(
      `seedEntry: content cannot be empty (received: "${content}")`
    )
  }
  if (
    !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(assignedDay) ||
    !isCalendarValidDate(assignedDay)
  ) {
    throw new Error(
      `seedEntry: assignedDay must be a valid YYYY-MM-DD date (received: "${assignedDay}")`
    )
  }

  const now = Date.now()
  const createdAt = data.createdAt ?? now
  const updatedAt = data.updatedAt ?? now

  // Auto-increment orderPosition based on existing entries for the day,
  // unless explicitly provided
  let orderPosition: number
  if (data.orderPosition === undefined) {
    const maxResult = db.exec(
      'SELECT COALESCE(MAX(order_position), -1) FROM entries WHERE assigned_day = ? AND is_deleted = 0',
      [assignedDay]
    )
    const maxPos = maxResult[0]?.values[0]?.[0]
    orderPosition = (typeof maxPos === 'number' ? maxPos : -1) + 1
  } else {
    orderPosition = data.orderPosition
  }

  db.run(
    `INSERT INTO entries (id, content, created_at, updated_at, assigned_day, order_position, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      content,
      createdAt,
      updatedAt,
      assignedDay,
      orderPosition,
      isDeleted ? 1 : 0
    ]
  )

  const result = db.exec('SELECT * FROM entries WHERE id = ?', [id])
  const resultSet = result[0]
  if (!resultSet?.values[0]) {
    throw new Error(`seedEntry: Failed to insert entry with id "${id}"`)
  }

  const cols = buildColumnMap(resultSet.columns)
  return rowToEntry(resultSet.values[0], cols)
}
