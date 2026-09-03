/**
 * Device Sync Serialization
 *
 * Reads the local `entries`, `tags`, and `entry_tags` tables into a
 * `SyncPayload` keyed by column name, and parses a payload received from a
 * peer back into typed rows, validating its shape defensively since it
 * crosses a trust boundary (a peer device, possibly running a different
 * version of this app).
 */

import {
  SYNC_TABLE_NAMES,
  type SyncEntryRow,
  type SyncEntryTagRow,
  type SyncPayload,
  type SyncTableName,
  type SyncTagRow
} from '@/shared/types/device-sync-payload-types'

import type { Database } from 'sql.js'

/** Thrown when a sync payload (from JSON or an untrusted object) has an invalid shape. */
export class DeviceSyncPayloadError extends Error {
  override name = 'DeviceSyncPayloadError'

  constructor(message: string) {
    super(message)
    // Restore prototype chain for instanceof checks in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

function assertRecord(
  value: unknown,
  table: SyncTableName
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DeviceSyncPayloadError(
      `expected an object for a "${table}" row, got ${typeof value}`
    )
  }
  return value as Record<string, unknown>
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new DeviceSyncPayloadError(
      `expected string for "${field}", got ${typeof value}`
    )
  }
  return value
}

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== 'number') {
    throw new DeviceSyncPayloadError(
      `expected number for "${field}", got ${typeof value}`
    )
  }
  return value
}

function toSyncEntryRow(raw: Record<string, unknown>): SyncEntryRow {
  return {
    id: assertString(raw['id'], 'id'),
    content: assertString(raw['content'], 'content'),
    created_at: assertNumber(raw['created_at'], 'created_at'),
    updated_at: assertNumber(raw['updated_at'], 'updated_at'),
    assigned_day: assertString(raw['assigned_day'], 'assigned_day'),
    order_position: assertNumber(raw['order_position'], 'order_position'),
    is_deleted: assertNumber(raw['is_deleted'], 'is_deleted')
  }
}

function toSyncTagRow(raw: Record<string, unknown>): SyncTagRow {
  return {
    id: assertString(raw['id'], 'id'),
    name: assertString(raw['name'], 'name'),
    created_at: assertNumber(raw['created_at'], 'created_at'),
    updated_at: assertNumber(raw['updated_at'], 'updated_at'),
    is_deleted: assertNumber(raw['is_deleted'], 'is_deleted')
  }
}

function toSyncEntryTagRow(raw: Record<string, unknown>): SyncEntryTagRow {
  return {
    id: assertString(raw['id'], 'id'),
    entry_id: assertString(raw['entry_id'], 'entry_id'),
    tag_id: assertString(raw['tag_id'], 'tag_id'),
    created_at: assertNumber(raw['created_at'], 'created_at'),
    updated_at: assertNumber(raw['updated_at'], 'updated_at'),
    is_deleted: assertNumber(raw['is_deleted'], 'is_deleted')
  }
}

/**
 * Read every row of one synced table (including soft-deleted rows — deletion
 * is just another field a sync must propagate) into name-keyed objects.
 */
function readTable(
  db: Database,
  table: SyncTableName
): Record<string, unknown>[] {
  const result = db.exec(`SELECT * FROM ${table}`)
  const resultSet = result[0]
  if (!resultSet) return []

  const { columns } = resultSet
  return resultSet.values.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  )
}

/**
 * Serialize the local database's complete `entries`, `tags`, and
 * `entry_tags` state into a `SyncPayload`.
 *
 * @param db - SQLite database instance
 * @returns The full current state of all three synced tables
 */
export function serializeDatabase(db: Database): SyncPayload {
  return {
    entries: readTable(db, 'entries').map(toSyncEntryRow),
    tags: readTable(db, 'tags').map(toSyncTagRow),
    entry_tags: readTable(db, 'entry_tags').map(toSyncEntryTagRow)
  }
}

/**
 * Validate an untrusted value (typically `JSON.parse` output from a peer) as
 * a `SyncPayload`, checking every row of every table against its expected
 * column shape.
 *
 * @throws {DeviceSyncPayloadError} If the value's shape doesn't match a `SyncPayload`
 */
export function validateSyncPayload(value: unknown): SyncPayload {
  if (typeof value !== 'object' || value === null) {
    throw new DeviceSyncPayloadError(
      `expected a sync payload object, got ${typeof value}`
    )
  }

  const obj = value as Record<string, unknown>
  for (const table of SYNC_TABLE_NAMES) {
    if (!Array.isArray(obj[table])) {
      throw new DeviceSyncPayloadError(`expected an array for "${table}"`)
    }
  }

  return {
    entries: (obj['entries'] as unknown[]).map((row) =>
      toSyncEntryRow(assertRecord(row, 'entries'))
    ),
    tags: (obj['tags'] as unknown[]).map((row) =>
      toSyncTagRow(assertRecord(row, 'tags'))
    ),
    entry_tags: (obj['entry_tags'] as unknown[]).map((row) =>
      toSyncEntryTagRow(assertRecord(row, 'entry_tags'))
    )
  }
}

/**
 * Serialize the local database's sync state directly to a JSON string.
 *
 * @param db - SQLite database instance
 */
export function serializeDatabaseToJSON(db: Database): string {
  return JSON.stringify(serializeDatabase(db))
}

/**
 * Parse and validate a JSON string (received from a peer) into a `SyncPayload`.
 *
 * @throws {DeviceSyncPayloadError} If the JSON is malformed or doesn't match a `SyncPayload`
 */
export function parseSyncPayloadJSON(json: string): SyncPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (cause) {
    throw new DeviceSyncPayloadError(
      `malformed sync payload JSON: ${cause instanceof Error ? cause.message : String(cause)}`
    )
  }
  return validateSyncPayload(parsed)
}
