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
import migration004 from './004-create-entries-fts.sql?raw'

import type { Database } from 'sql.js'

/** Migrations in order; the schema version is the 1-based position in this list */
const MIGRATIONS = [migration001, migration002, migration003, migration004]

/** The schema version this build writes and understands */
export const LATEST_SCHEMA_VERSION = MIGRATIONS.length

/**
 * Run all pending migrations on the database
 *
 * @param db - SQLite database instance to migrate
 * @returns void
 * @throws {Error} If the database was saved by a newer version of the app
 * @throws {Error} If a migration SQL statement fails; wraps original error with context
 */
export function runMigrations(db: Database): void {
  // Check current schema version
  const versionResult = db.exec('PRAGMA user_version')
  const versionValue = versionResult[0]?.values[0]?.[0]
  const currentVersion = typeof versionValue === 'number' ? versionValue : 0

  // A newer build's database is refused untouched rather than opened and saved back
  if (currentVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(
      'This database was saved by a newer version of Mizukara. Update the app, then try again.'
    )
  }

  try {
    // Apply each migration the database has not seen yet.
    // db.exec() handles multi-statement SQL correctly (db.run() does not).
    for (const migration of MIGRATIONS.slice(currentVersion)) {
      db.exec(migration)
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
