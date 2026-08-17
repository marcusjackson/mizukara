/**
 * Database migration runner
 *
 * Reads SQL migration files from this directory and applies them in order.
 * Each migration file should set PRAGMA user_version at the end.
 *
 * Migration files use Vite's ?raw import to load SQL as strings.
 */

// Import SQL migration files as strings
import migration001 from './001-create-entries.sql?raw'
import migration002 from './002-create-tags.sql?raw'
import migration003 from './003-tags-name-unique-index.sql?raw'

import type { Database } from 'sql.js'

/**
 * Run all pending migrations on the database
 *
 * @param db - SQLite database instance to migrate
 * @returns void
 * @throws {Error} If a migration SQL statement fails; wraps original error with context
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

    // Apply migration 2 if not already applied
    if (currentVersion < 2) {
      db.exec(migration002)
    }

    // Apply migration 3 if not already applied
    if (currentVersion < 3) {
      db.exec(migration003)
    }
  } catch (error) {
    // If migration fails, re-throw so the caller can handle it
    // The calling code in init.ts will surface the error appropriately
    throw new Error(
      `Database migration failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    )
  }
}
