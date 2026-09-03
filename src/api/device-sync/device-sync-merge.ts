/**
 * Device Sync Merge Engine
 *
 * Applies a peer's `SyncPayload` to the local database: upsert-by-`id`,
 * newer `updated_at` wins, local wins on a tie. Each table is applied inside
 * its own transaction so a dropped connection or a thrown error can never
 * leave a table half-merged — see
 * docs/units/device-sync/atlas.md.
 */

import { schedulePersist } from '@/db/indexeddb'
import tagsNameActiveUniqueIndexSql from '@/db/migrations/003-tags-name-unique-index.sql?raw'

import { dedupeActiveTags } from './device-sync-tag-dedupe'

import type {
  SyncEntryRow,
  SyncEntryTagRow,
  SyncPayload,
  SyncTableName,
  SyncTagRow
} from '@/shared/types/device-sync-payload-types'
import type { Database, SqlValue } from 'sql.js'

/**
 * Name of the partial unique index migration 003 adds on `tags`
 * (`LOWER(name) WHERE is_deleted = 0`). The merge below drops it for the
 * duration of the tag merge and dedupe — see `applySyncPayload`.
 */
const TAGS_NAME_ACTIVE_UNIQUE_INDEX = 'idx_tags_name_active_unique'

const ENTRY_COLUMNS = [
  'id',
  'content',
  'created_at',
  'updated_at',
  'assigned_day',
  'order_position',
  'is_deleted'
] as const satisfies readonly (keyof SyncEntryRow)[]

const TAG_COLUMNS = [
  'id',
  'name',
  'created_at',
  'updated_at',
  'is_deleted'
] as const satisfies readonly (keyof SyncTagRow)[]

const ENTRY_TAG_COLUMNS = [
  'id',
  'entry_id',
  'tag_id',
  'created_at',
  'updated_at',
  'is_deleted'
] as const satisfies readonly (keyof SyncEntryTagRow)[]

interface SyncRowBase {
  id: string
  updated_at: number
}

/**
 * Upsert a single row by `id`: insert if the local table has no row with
 * this `id`, otherwise overwrite only when the incoming row's `updated_at`
 * is strictly greater than the local row's — a tie leaves the local row
 * untouched, so local wins on a tie.
 */
function upsertRow<Row extends SyncRowBase>(
  db: Database,
  table: SyncTableName,
  columns: readonly (keyof Row & string)[],
  row: Row
): void {
  const existing = db.exec(`SELECT updated_at FROM ${table} WHERE id = ?`, [
    row.id
  ])
  const existingUpdatedAt = existing[0]?.values[0]?.[0]

  if (existingUpdatedAt === undefined) {
    const placeholders = columns.map(() => '?').join(', ')
    db.run(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      columns.map((col) => row[col] as SqlValue)
    )
    return
  }

  if (
    typeof existingUpdatedAt === 'number' &&
    row.updated_at > existingUpdatedAt
  ) {
    const updateColumns = columns.filter((col) => col !== 'id')
    const assignments = updateColumns.map((col) => `${col} = ?`).join(', ')
    const values = updateColumns.map((col) => row[col] as SqlValue)

    db.run(`UPDATE ${table} SET ${assignments} WHERE id = ?`, [
      ...values,
      row.id
    ])
  }
}

/**
 * Merge one table's rows, wrapped in a single transaction so the table is
 * either fully updated or left exactly as it was.
 */
function mergeTable<Row extends SyncRowBase>(
  db: Database,
  table: SyncTableName,
  columns: readonly (keyof Row & string)[],
  rows: readonly Row[]
): void {
  db.run('BEGIN TRANSACTION')
  try {
    for (const row of rows) {
      upsertRow(db, table, columns, row)
    }
    db.run('COMMIT')
  } catch (error) {
    db.run('ROLLBACK')
    throw error
  }
}

/**
 * Apply a peer's complete sync payload to the local database: merge
 * `entries`, `tags`, and `entry_tags` (each atomically, per table), then run
 * the tag-name dedupe pass so both devices converge on the same canonical
 * tag for any name collision the merge just introduced, then schedule the
 * result through the fast persistence path (`schedulePersist()`,
 * `src/db/indexeddb.ts`) rather than leaving it to the last-resort
 * lifecycle save — see `docs/units/persistence/atlas.md`.
 *
 * The tags merge can transiently produce two active rows with the same
 * case-insensitive name — that's exactly what the dedupe pass exists to
 * resolve — which migration 003's partial unique index would otherwise
 * reject at INSERT time before dedupe gets to run. The index is dropped for
 * the duration of the tags/entry_tags merge and dedupe, then recreated from
 * the same migration SQL (so the two definitions can't drift) once the
 * table is guaranteed collision-free again, in a `finally` so the
 * constraint is always restored even if the merge throws partway through.
 *
 * @param db - SQLite database instance
 * @param payload - The peer's serialized `entries`/`tags`/`entry_tags` state
 */
export function applySyncPayload(db: Database, payload: SyncPayload): void {
  mergeTable(db, 'entries', ENTRY_COLUMNS, payload.entries)

  db.run(`DROP INDEX IF EXISTS ${TAGS_NAME_ACTIVE_UNIQUE_INDEX}`)
  try {
    mergeTable(db, 'tags', TAG_COLUMNS, payload.tags)
    mergeTable(db, 'entry_tags', ENTRY_TAG_COLUMNS, payload.entry_tags)
    dedupeActiveTags(db)
  } finally {
    db.exec(tagsNameActiveUniqueIndexSql)
  }

  schedulePersist()
}
