/**
 * Database initialization and setup
 *
 * Handles:
 * - Loading sql.js library
 * - Loading existing database from IndexedDB or creating new
 * - Running migrations to bring schema up to date
 * - Attaching lifecycle listeners for persistence
 */

import { loadFromIndexedDB, saveToIndexedDB, setDatabaseRef } from './indexeddb'
import { attachLifecycleListeners } from './lifecycle'
import { runMigrations } from './migrations'

import type { BindParams } from 'sql.js'

// =============================================================================
// Types
// =============================================================================

/**
 * Shape of a sql.js database instance as used by this module.
 *
 * We define a local interface matching the subset of the sql.js Database API
 * used here. This avoids relying on dynamic import type inference issues
 * caused by sql.js's CJS-style `export =` module pattern.
 *
 * This interface is structurally compatible with Database from @types/sql.js,
 * so instances can be passed to functions from other modules that accept it.
 */
interface SqlDatabase {
  run(sql: string, params?: BindParams): SqlDatabase
  exec(
    sql: string,
    params?: BindParams
  ): { columns: string[]; values: SqlValue[][] }[]
  close(): void
  export(): Uint8Array
}

type SqlValue = string | number | Uint8Array | null

/**
 * Shape of the sql.js static module returned by initSqlJs.
 */
interface SqlJsModule {
  Database: new (data?: ArrayLike<number> | null) => SqlDatabase
}

/**
 * Load and initialize the sql.js WASM library
 *
 * Shared helper to avoid duplicating the initialization block.
 *
 * // sql.js uses CommonJS 'export =' syntax. Dynamic import resolves to
 * // { default: initSqlJs } in ESM bundlers, so we cast explicitly.
 */
async function loadSqlJs(): Promise<SqlJsModule> {
  const sqlJsModule = (await import('sql.js')) as {
    default: (config?: {
      locateFile?: (file: string) => string
    }) => Promise<SqlJsModule>
  }
  return sqlJsModule.default({
    // Load WASM from public directory (self-hosted for reliability)
    // Use BASE_URL to ensure correct path on GitHub Pages with /mizukara/ base
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`
  })
}

/**
 * Initialize the database
 *
 * @returns Initialized sql.js Database instance
 * @throws {Error} If the sql.js WASM binary cannot be loaded
 * @throws {Error} If IndexedDB is unavailable or a write fails
 * @throws {Error} If any pending database migration fails
 */
export async function initializeDatabase(): Promise<SqlDatabase> {
  // Load sql.js library
  const SQL = await loadSqlJs()

  // Try to load existing database from IndexedDB
  const existingData = await loadFromIndexedDB()

  // Create database from existing data or fresh
  const db = existingData ? new SQL.Database(existingData) : new SQL.Database()

  // Run any pending migrations
  runMigrations(db)

  // Set database reference for persistence operations
  setDatabaseRef(db)

  // Persist after migrations
  await saveToIndexedDB(db.export())

  // Attach lifecycle listeners for automatic persistence
  attachLifecycleListeners()

  return db
}

/**
 * Replace database with imported data
 *
 * Used for database import functionality.
 * Validates the SQLite magic header before attempting to load the file, so
 * invalid files (e.g. JPEG, ZIP) produce a clear error instead of an opaque
 * WASM crash.
 *
 * @throws {Error} If database initialization fails
 * @param data - Binary database data to import
 * @returns New database instance
 * @throws {Error} If data is not a valid SQLite database file
 */
export async function replaceDatabaseWithImported(
  data: Uint8Array
): Promise<SqlDatabase> {
  // Validate SQLite magic header: first 6 bytes must spell "SQLite"
  const SQLITE_MAGIC = [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65] as const
  if (data.length < 16 || !SQLITE_MAGIC.every((b, i) => data[i] === b)) {
    throw new Error('Invalid file: not a SQLite database')
  }

  // Load sql.js library
  const SQL = await loadSqlJs()

  // Create new database from imported data
  const newDb = new SQL.Database(data)

  // Run migrations to ensure schema is up to date
  runMigrations(newDb)

  // Update database reference for persistence
  setDatabaseRef(newDb)

  // Persist to IndexedDB
  await saveToIndexedDB(newDb.export())

  return newDb
}
