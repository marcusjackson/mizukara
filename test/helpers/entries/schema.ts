/**
 * Entry Schema and Types for Test Helpers
 */

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
  /** Override auto-generated createdAt timestamp (Unix ms) */
  createdAt?: number
  /** Override auto-generated updatedAt timestamp (Unix ms) */
  updatedAt?: number
}

// Re-export Entry type for convenience
export type { Entry } from '@/shared/types/entry-types'

/**
 * SQL to create the entries table and indexes for use in test databases.
 * Mirrors the production migration in 001-create-entries.sql.
 */
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
