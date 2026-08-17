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

import type { BindParams, Database } from 'sql.js'
import type { DeepReadonly, Ref, ShallowRef } from 'vue'

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
  database: DeepReadonly<ShallowRef<Database | null>>
  /** Whether the database has been initialized */
  isInitialized: DeepReadonly<Ref<boolean>>
  /** Whether initialization is in progress */
  isInitializing: DeepReadonly<Ref<boolean>>
  /** Error that occurred during initialization, if any */
  initError: DeepReadonly<Ref<Error | null>>
  /** Initialize the database. Safe to call multiple times. */
  initialize: () => Promise<void>
  /** Persist current database state to IndexedDB */
  persist: () => Promise<void>
  /** Execute a SQL query and return results */
  exec: (sql: string, params?: BindParams) => ReturnType<Database['exec']>
  /** Execute a SQL statement (no results) */
  run: (sql: string, params?: BindParams) => void
  /** Replace the current database with imported data */
  replaceDatabase: (data: Uint8Array) => Promise<void>
}

// =============================================================================
// Internal helpers
// =============================================================================

async function initialize(): Promise<void> {
  if (isInitialized.value) {
    return
  }

  if (initPromise) {
    return initPromise
  }

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

function exec(sql: string, params?: BindParams): ReturnType<Database['exec']> {
  if (!database.value) {
    throw new Error('Database not initialized')
  }
  return database.value.exec(sql, params ?? null)
}

function run(sql: string, params?: BindParams): void {
  if (!database.value) {
    throw new Error('Database not initialized')
  }
  database.value.run(sql, params ?? null)
  // Auto-persist to IndexedDB after write operations (debounced)
  // This groups rapid writes into a single save operation
  schedulePersist()
}

async function replaceDatabase(data: Uint8Array): Promise<void> {
  if (database.value) {
    database.value.close()
  }
  database.value = markRaw(await replaceDatabaseWithImported(data))
  isInitialized.value = true
}

// =============================================================================
// Composable
// =============================================================================

/**
 * Provides access to the singleton sql.js database instance.
 *
 * Safe to call multiple times — returns shared reactive state.
 * Core lifecycle (initialization, persistence, migrations) is handled
 * automatically; callers only need to invoke {@link UseDatabase.initialize}
 * once at app startup.
 *
 * @returns Database access functions and reactive state refs
 * @example
 * const { database, isInitialized, initialize, run, exec } = useDatabase()
 * await initialize()
 */
export function useDatabase(): UseDatabase {
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
