/**
 * Device Sync Payload Types
 *
 * Shapes for the merge engine's sync payload: `entries`, `tags`, and
 * `entry_tags` serialized to JSON keyed by database column name (not the
 * app's camelCase field names), so the payload survives being read by a
 * different version of the sync code than the one that wrote it — see
 * docs/units/device-sync/atlas.md.
 */

/** The three tables a sync session exchanges, in merge-application order. */
export const SYNC_TABLE_NAMES = ['entries', 'tags', 'entry_tags'] as const

export type SyncTableName = (typeof SYNC_TABLE_NAMES)[number]

/** A `entries` row, keyed exactly like the `entries` table's columns. */
export interface SyncEntryRow {
  id: string
  content: string
  created_at: number
  updated_at: number
  assigned_day: string
  order_position: number
  is_deleted: number
}

/** A `tags` row, keyed exactly like the `tags` table's columns. */
export interface SyncTagRow {
  id: string
  name: string
  created_at: number
  updated_at: number
  is_deleted: number
}

/** An `entry_tags` row, keyed exactly like the `entry_tags` table's columns. */
export interface SyncEntryTagRow {
  id: string
  entry_id: string
  tag_id: string
  created_at: number
  updated_at: number
  is_deleted: number
}

/** One device's complete state of all three synced tables. */
export interface SyncPayload {
  entries: SyncEntryRow[]
  tags: SyncTagRow[]
  entry_tags: SyncEntryTagRow[]
}
