/**
 * Entry Query Functions
 *
 * Query operations for journal entries.
 * Handles finding entries by day and by ID with proper filtering.
 */

import { rowToEntry } from './entry-helpers'

import type { Entry } from '@/shared/types/entry-types'
import type { Database } from 'sql.js'

/**
 * Find all entries for a specific day, ordered by order_position then created_at
 *
 * Uses composite index on (assigned_day, is_deleted, order_position) for optimal
 * performance. Automatically filters out soft-deleted entries.
 *
 * @param db - SQLite database instance
 * @param assignedDay - ISO date string in YYYY-MM-DD format
 * @returns Array of entries for the specified day, empty array if none found
 *
 * @example
 * const entries = findByDay(db, '2026-02-11')
 * // Returns all active entries assigned to Feb 11, 2026
 */
export function findByDay(db: Database, assignedDay: string): Entry[] {
  const result = db.exec(
    `
    SELECT id, content, created_at, updated_at, assigned_day, order_position, is_deleted
    FROM entries
    WHERE assigned_day = ? AND is_deleted = 0
    ORDER BY order_position ASC, created_at ASC
  `,
    [assignedDay]
  )

  if (!result[0]) return []

  return result[0].values.map(rowToEntry)
}

/**
 * Find single entry by ID
 *
 * Automatically filters out soft-deleted entries. Returns null if entry
 * does not exist or has been soft-deleted.
 *
 * @param db - SQLite database instance
 * @param id - Entry UUID (must be valid UUID v4 format)
 * @returns Entry object if found and active, null otherwise
 *
 * @example
 * const entry = findById(db, '550e8400-e29b-41d4-a716-446655440000')
 * if (entry) {
 *   console.log(entry.content)
 * }
 */
export function findById(db: Database, id: string): Entry | null {
  const result = db.exec(
    `
    SELECT id, content, created_at, updated_at, assigned_day, order_position, is_deleted
    FROM entries
    WHERE id = ? AND is_deleted = 0
    LIMIT 1
  `,
    [id]
  )

  if (!result[0]?.values[0]) return null

  return rowToEntry(result[0].values[0])
}
