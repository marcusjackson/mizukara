/**
 * Entry Schema and Types for Test Helpers
 */

import type { Entry } from '@/shared/types/entry-types'

/**
 * Test-only entry seeding data
 *
 * Allows overriding auto-generated fields for predictable test scenarios.
 * Not related to CreateEntryInput (which is for production API).
 */
export interface SeedEntryInput {
  /** Entry content (defaults to 'Test entry content') */
  content?: string
  /** ISO date in YYYY-MM-DD format (defaults to '2022-01-01') */
  assignedDay?: string
  /** Override auto-generated UUID for predictable test IDs */
  id?: string
  /** Override auto-calculated position for testing custom ordering */
  orderPosition?: number
  /** Test soft-deleted entries (defaults to false) */
  isDeleted?: boolean
}

// Re-export Entry type for convenience
export type { Entry } from '@/shared/types/entry-types'

export const ENTRIES_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    assigned_day TEXT NOT NULL,
    order_position INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_entries_assigned_day
    ON entries(assigned_day, is_deleted, order_position);

  CREATE INDEX IF NOT EXISTS idx_entries_is_deleted
    ON entries(is_deleted);
`

/**
 * Helper to convert SQL row to Entry object
 */
export function rowToEntry(row: unknown[]): Entry {
  return {
    id: row[0] as string,
    content: row[1] as string,
    createdAt: row[2] as number,
    updatedAt: row[3] as number,
    assignedDay: row[4] as string,
    orderPosition: row[5] as number,
    isDeleted: Boolean(row[6])
  }
}
