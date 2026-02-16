/**
 * Database access composable
 *
 * Thin wrapper exposing initialized database state.
 * Core database logic has been split into focused modules:
 * - src/db/init.ts - Database initialization
 * - src/db/indexeddb.ts - IndexedDB persistence
 * - src/db/lifecycle.ts - Page lifecycle handlers
 * - src/db/migrations/ - Migration runner and SQL files
 *
 * Persistence Strategy:
 * - Auto-persist after write operations (debounced to avoid excessive saves)
 * - Immediate persist on visibility change (when app goes to background)
 * - Sync persist attempt on beforeunload (last chance before page unload)
 * - This ensures data survives Android PWA session kills
 */

import { markRaw, readonly, ref, shallowRef } from 'vue'

import { saveToIndexedDB, schedulePersist } from '@/db/indexeddb'
import { initializeDatabase, replaceDatabaseWithImported } from '@/db/init'

import type { Database } from 'sql.js'
import type { Ref, ShallowRef } from 'vue'

// =============================================================================
// Singleton State
// =============================================================================

const database = shallowRef<Database | null>(null)
const isInitialized = ref(false)
const isInitializing = ref(false)
const initError = ref<Error | null>(null)

let initPromise: Promise<void> | null = null

// =============================================================================
// Composable Interface
// =============================================================================

export interface UseDatabase {
  /** The sql.js database instance. Null until initialized. */
  database: ShallowRef<Database | null>
  /** Whether the database has been initialized */
  isInitialized: Ref<boolean>
  /** Whether initialization is in progress */
  isInitializing: Ref<boolean>
  /** Error that occurred during initialization, if any */
  initError: Ref<Error | null>
  /** Initialize the database. Safe to call multiple times. */
  initialize: () => Promise<void>
  /** Persist current database state to IndexedDB */
  persist: () => Promise<void>
  /** Execute a SQL query and return results */
  exec: (sql: string, params?: unknown[]) => ReturnType<Database['exec']>
  /** Execute a SQL statement (no results) */
  run: (sql: string, params?: unknown[]) => void
  /** Replace the current database with imported data */
  replaceDatabase: (data: Uint8Array) => Promise<void>
}

// =============================================================================
// Composable
// =============================================================================

// TODO: Consider splitting this large function into smaller focused functions
// eslint-disable-next-line max-lines-per-function
export function useDatabase(): UseDatabase {
  async function initialize(): Promise<void> {
    // If already initialized, return immediately
    if (isInitialized.value) {
      return
    }

    // If initialization is in progress, wait for it
    if (initPromise) {
      return initPromise
    }

    // Start initialization
    isInitializing.value = true
    initError.value = null

    initPromise = (async () => {
      try {
        database.value = markRaw(await initializeDatabase())
        isInitialized.value = true
      } catch (err) {
        initError.value = err instanceof Error ? err : new Error(String(err))
        throw initError.value
      } finally {
        isInitializing.value = false
      }
    })()

    return initPromise
  }

  async function persist(): Promise<void> {
    if (!database.value) {
      throw new Error('Database not initialized')
    }
    await saveToIndexedDB(database.value.export())
  }

  function exec(sql: string, params?: unknown[]): ReturnType<Database['exec']> {
    if (!database.value) {
      throw new Error('Database not initialized')
    }
    return database.value.exec(sql, params)
  }

  function run(sql: string, params?: unknown[]): void {
    if (!database.value) {
      throw new Error('Database not initialized')
    }
    database.value.run(sql, params)
    // Auto-persist to IndexedDB after write operations (debounced)
    // This groups rapid writes into a single save operation
    schedulePersist()
  }

  async function replaceDatabase(data: Uint8Array): Promise<void> {
    // Close old database if it exists
    if (database.value) {
      database.value.close()
    }

    // Initialize with imported data
    database.value = markRaw(await replaceDatabaseWithImported(data))

    // Ensure initialized state is set
    isInitialized.value = true
  }

  return {
    database: readonly(database),
    isInitialized: readonly(isInitialized),
    isInitializing: readonly(isInitializing),
    initError: readonly(initError),
    initialize,
    persist,
    exec,
    run,
    replaceDatabase
  }
}
