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
