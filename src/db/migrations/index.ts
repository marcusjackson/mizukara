/**
 * Database migration runner
 *
 * Reads SQL migration files from this directory and applies them in order.
 * Each migration file should set PRAGMA user_version at the end.
 *
 * Migration files use Vite's ?raw import to load SQL as strings.
 */

// TODO: Remove eslint-disable when sql.js types are improved

// Import SQL migration files as strings
import migration001 from './001-create-entries.sql?raw'

import type { Database } from 'sql.js'

/**
 * Run all pending migrations on the database
 */
export function runMigrations(db: Database): void {
  // Check current schema version
  const versionResult = db.exec('PRAGMA user_version')
  const versionValue = versionResult[0]?.values[0]?.[0]
  const currentVersion = typeof versionValue === 'number' ? versionValue : 0

  try {
    // Apply migration 1 if not already applied
    if (currentVersion < 1) {
      // Use db.exec() for multiple SQL statements instead of db.run()
      // db.exec() handles multi-statement SQL correctly
      db.exec(migration001)
    }
  } catch (error) {
    // If migration fails, log error but don't crash the app
    // The database will be in an inconsistent state, but the app can still function
    // In production, this should trigger a database reset or recovery mechanism
    console.error('Migration failed:', error)
    throw new Error(
      `Database migration failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
