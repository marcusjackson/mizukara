/**
 * Tag Schema and Types for Test Helpers
 */

/**
 * Test-only tag seeding data
 */
export interface SeedTagInput {
  /** Override auto-generated UUID for predictable test IDs */
  id?: string
  /** Tag name (defaults to 'test-tag') */
  name?: string
  /** Test soft-deleted tags (defaults to false) */
  isDeleted?: boolean
  /** Override timestamp (defaults to Date.now()) */
  createdAt?: number
  /** Override timestamp (defaults to Date.now()) */
  updatedAt?: number
}

/**
 * Test-only entry-tag association seeding data
 */
export interface SeedEntryTagInput {
  /** Override auto-generated UUID for predictable test IDs */
  id?: string
  /** Entry ID to associate */
  entryId: string
  /** Tag ID to associate */
  tagId: string
  /** Test soft-deleted associations (defaults to false) */
  isDeleted?: boolean
  /** Override timestamp (defaults to Date.now()) */
  createdAt?: number
  /** Override timestamp (defaults to Date.now()) */
  updatedAt?: number
}

// Re-export types for convenience
export type { EntryTag, Tag } from '@/shared/types/tag-types'
