/**
 * Tag Schema and Types for Test Helpers
 */

import type { EntryTag, Tag } from '@/shared/types/tag-types'

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

export const TAGS_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL COLLATE NOCASE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_tags_name
    ON tags(name, is_deleted);

  CREATE TABLE IF NOT EXISTS entry_tags (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (entry_id) REFERENCES entries(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
  );

  CREATE INDEX IF NOT EXISTS idx_entry_tags_entry_id
    ON entry_tags(entry_id, is_deleted);

  CREATE INDEX IF NOT EXISTS idx_entry_tags_tag_id
    ON entry_tags(tag_id, is_deleted);
`

/**
 * Convert SQLite query result row to Tag object
 *
 * Expected column order: id, name, created_at, updated_at, is_deleted
 */
export function rowToTag(row: unknown[]): Tag {
  return {
    id: row[0] as string,
    name: row[1] as string,
    createdAt: row[2] as number,
    updatedAt: row[3] as number,
    isDeleted: Boolean(row[4])
  }
}

/**
 * Convert SQLite query result row to EntryTag object
 *
 * Expected column order: id, entry_id, tag_id, created_at, updated_at, is_deleted
 */
export function rowToEntryTag(row: unknown[]): EntryTag {
  return {
    id: row[0] as string,
    entryId: row[1] as string,
    tagId: row[2] as string,
    createdAt: row[3] as number,
    updatedAt: row[4] as number,
    isDeleted: Boolean(row[5])
  }
}
