/**
 * Tag Seeding Functions for Test Helpers
 */

import initSqlJs from 'sql.js'

import { rowToEntryTag } from '@/api/entry-tags/entry-tag-row-mappers'
import { rowToTag } from '@/api/tags/tag-row-mappers'

import { runMigrations } from '@/db/migrations'

import type { SeedEntryTagInput, SeedTagInput } from './schema'
import type { EntryTag, Tag } from '@/shared/types/tag-types'
import type { Database } from 'sql.js'

/**
 * Create a fresh in-memory test database with the production migrations applied,
 * so the test schema cannot drift from what ships
 */
export async function createTestDatabaseForTags(): Promise<Database> {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  runMigrations(db)
  return db
}

/**
 * Seed a tag into the test database with sensible defaults
 */
export function seedTag(db: Database, data: SeedTagInput = {}): Tag {
  const {
    id = crypto.randomUUID(),
    isDeleted = false,
    name = 'test-tag'
  } = data

  if (name.trim() === '') {
    throw new Error('seedTag: name must be a non-empty string')
  }

  const now = Date.now()
  const createdAt = data.createdAt ?? now
  const updatedAt = data.updatedAt ?? now

  db.run(
    `INSERT INTO tags (id, name, created_at, updated_at, is_deleted)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, createdAt, updatedAt, isDeleted ? 1 : 0]
  )

  const result = db.exec('SELECT * FROM tags WHERE id = ?', [id])
  const row = result[0]?.values[0]
  if (!row) {
    throw new Error(`seedTag: Failed to insert tag with id "${id}"`)
  }

  return rowToTag(row)
}

/**
 * Seed an entry tag association into the test database with sensible defaults
 */
export function seedEntryTag(db: Database, data: SeedEntryTagInput): EntryTag {
  const { entryId, id = crypto.randomUUID(), isDeleted = false, tagId } = data

  const now = Date.now()
  const createdAt = data.createdAt ?? now
  const updatedAt = data.updatedAt ?? now

  db.run(
    `INSERT INTO entry_tags (id, entry_id, tag_id, created_at, updated_at, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, entryId, tagId, createdAt, updatedAt, isDeleted ? 1 : 0]
  )

  const result = db.exec('SELECT * FROM entry_tags WHERE id = ?', [id])
  const row = result[0]?.values[0]
  if (!row) {
    throw new Error(`seedEntryTag: Failed to insert entry_tag with id "${id}"`)
  }

  return rowToEntryTag(row)
}

/**
 * Seed a minimal entry into the test database (for use in tag tests that need entry FK)
 */
export function seedEntryForTags(
  db: Database,
  data: {
    id?: string
    assignedDay?: string
    isDeleted?: boolean
    orderPosition?: number
    createdAt?: number
  } = {}
): string {
  const {
    assignedDay = '2026-01-01',
    id = crypto.randomUUID(),
    isDeleted = false,
    orderPosition = 0
  } = data

  const now = Date.now()
  const createdAt = data.createdAt ?? now

  db.run(
    `INSERT INTO entries (id, content, created_at, updated_at, assigned_day, order_position, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      'Test entry content',
      createdAt,
      now,
      assignedDay,
      orderPosition,
      isDeleted ? 1 : 0
    ]
  )

  return id
}
