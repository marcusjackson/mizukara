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

// TODO: Add @types/sql.js when sql.js types are improved for strict TypeScript
import type { Database } from 'sql.js'

/**
 * Initialize the database
 *
 * @returns Initialized sql.js Database instance
 */
export async function initializeDatabase(): Promise<Database> {
  // Dynamic import for sql.js to ensure proper ESM loading
  const { default: initSqlJs } = await import('sql.js')

  // Initialize sql.js
  const SQL = await initSqlJs({
    // Load WASM from public directory (self-hosted for reliability)
    // Use BASE_URL to ensure correct path on GitHub Pages with /mizukara/ base
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`
  })

  // Try to load existing database from IndexedDB
  const existingData = await loadFromIndexedDB()

  let db: Database
  if (existingData) {
    // Load existing database
    db = new SQL.Database(existingData)
  } else {
    // Create new database
    db = new SQL.Database()
  }

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
 *
 * @param data - Binary database data to import
 * @returns New database instance
 */
export async function replaceDatabaseWithImported(
  data: Uint8Array
): Promise<Database> {
  // Dynamic import for sql.js to ensure proper ESM loading
  const { default: initSqlJs } = await import('sql.js')

  // Initialize sql.js
  const SQL = await initSqlJs({
    // Use BASE_URL to ensure correct path on GitHub Pages with /mizukara/ base
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`
  })

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
