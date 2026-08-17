/**
 * IndexedDB persistence layer for SQLite database
 *
 * Handles saving and loading the SQLite database binary to/from IndexedDB.
 * Provides both async and sync save methods for different lifecycle events.
 */

import { useToast } from '@/shared/composables/use-toast'

import type { Database } from 'sql.js'

const INDEXEDDB_NAME = 'mizukara'
const INDEXEDDB_STORE = 'database'
const INDEXEDDB_KEY = 'db'

/** Debounce delay for auto-persist after writes (ms) */
const PERSIST_DEBOUNCE_MS = 100

/** Pending debounce timer for auto-persist */
let persistDebounceTimer: ReturnType<typeof setTimeout> | null = null

/** Whether a persist operation is currently in progress */
let isPersisting = false

/** Queue the next persist after current one completes */
let persistQueuedWhileBusy = false

/** In-progress persist promise — awaited by persistImmediately to avoid race conditions */
let currentPersistPromise: Promise<void> | null = null

/** Reference to the database instance for persistence */
let databaseRef: Database | null = null

/** Cached IndexedDB connection promise — re-used across load/save operations */
let _idbConnection: Promise<IDBDatabase> | null = null

/** Cached open IndexedDB connection for use in synchronous contexts */
let idbConnectionRef: IDBDatabase | null = null

// =============================================================================
// IndexedDB Operations
// =============================================================================

/**
 * Open IndexedDB connection, caching for reuse.
 * Subsequent calls return the same open connection.
 *
 * @returns Promise resolving to opened IDBDatabase
 * @throws {Error} If opening fails
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  if (idbConnectionRef) {
    return Promise.resolve(idbConnectionRef)
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, 1)

    request.onerror = () => {
      reject(new Error(request.error?.message ?? 'Failed to open IndexedDB'))
    }
    request.onblocked = () => {
      reject(
        new Error(
          'IndexedDB upgrade blocked. Please close other tabs and reload.'
        )
      )
    }
    request.onsuccess = () => {
      idbConnectionRef = request.result
      // Clear cache if the connection is unexpectedly closed
      idbConnectionRef.onclose = () => {
        idbConnectionRef = null
      }
      resolve(idbConnectionRef)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
        db.createObjectStore(INDEXEDDB_STORE)
      }
    }
  })
}

/**
 * Get (or create) the shared IndexedDB connection.
 * Caching the connection avoids opening a new connection for every operation.
 *
 * @returns Promise resolving to database binary or null if empty
 * @throws {Error} If load fails
 */
function getIdbConnection(): Promise<IDBDatabase> {
  _idbConnection ??= openIndexedDB()
  return _idbConnection
}

/**
 * Load database from IndexedDB
 */
export async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  const idb = await getIdbConnection()

  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(INDEXEDDB_STORE, 'readonly')
    const store = transaction.objectStore(INDEXEDDB_STORE)
    const request = store.get(INDEXEDDB_KEY)

    request.onerror = () => {
      reject(
        new Error(request.error?.message ?? 'Failed to load from IndexedDB')
      )
    }
    request.onsuccess = () => {
      const result = request.result as Uint8Array | undefined
      resolve(result ?? null)
    }
  })
}

/**
 * Save database to IndexedDB (async)
 *
 * @param data - Database binary to save
 * @returns Promise resolving when saved
 * @throws {Error} If save fails
 */
export async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await getIdbConnection()

  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(INDEXEDDB_STORE, 'readwrite')
    const store = transaction.objectStore(INDEXEDDB_STORE)
    const request = store.put(data, INDEXEDDB_KEY)

    request.onerror = () => {
      reject(new Error(request.error?.message ?? 'Failed to save to IndexedDB'))
    }
    request.onsuccess = () => {
      resolve()
    }
  })
}

/**
 * Synchronous save to IndexedDB - used in beforeunload where async is unreliable.
 * Uses cached IDB connection to start the write transaction immediately without
 * waiting for an async open, which may not complete before the page unloads.
 * Returns immediately after starting the transaction.
 */
export function saveToIndexedDBSync(data: Uint8Array): void {
  if (idbConnectionRef) {
    // Use cached connection — starts the write immediately (no async open needed)
    const transaction = idbConnectionRef.transaction(
      INDEXEDDB_STORE,
      'readwrite'
    )
    const store = transaction.objectStore(INDEXEDDB_STORE)
    store.put(data, INDEXEDDB_KEY)
    return
  }

  // Fallback: open a new connection (may not complete before full unload)
  const request = indexedDB.open(INDEXEDDB_NAME, 1)

  request.onerror = () => {
    console.error(
      'saveToIndexedDBSync: failed to open IndexedDB',
      request.error
    )
  }

  request.onsuccess = () => {
    const idb = request.result
    try {
      const transaction = idb.transaction(INDEXEDDB_STORE, 'readwrite')
      transaction.onerror = () => {
        console.error(
          'saveToIndexedDBSync: transaction failed',
          transaction.error
        )
      }
      transaction.objectStore(INDEXEDDB_STORE).put(data, INDEXEDDB_KEY)
    } catch (err) {
      console.error('saveToIndexedDBSync: unexpected error', err)
    }
  }
}

// =============================================================================
// Persistence Management
// =============================================================================

/**
 * Set the database reference for persistence operations
 *
 * @param db - Database instance or null
 */
export function setDatabaseRef(db: Database | null): void {
  databaseRef = db
}

/**
 * Schedule a debounced persist operation.
 * Groups rapid writes into a single IndexedDB save.
 */
export function schedulePersist(): void {
  if (!databaseRef) return

  // Clear any pending debounce timer
  if (persistDebounceTimer) {
    clearTimeout(persistDebounceTimer)
  }

  // Schedule persist after debounce delay
  persistDebounceTimer = setTimeout(() => {
    persistDebounceTimer = null
    void executePersist()
  }, PERSIST_DEBOUNCE_MS)
}

/**
 * Execute a persist operation, handling concurrency.
 */
async function executePersist(): Promise<void> {
  if (!databaseRef) return

  // If already persisting, queue for later
  if (isPersisting) {
    persistQueuedWhileBusy = true
    return
  }

  isPersisting = true

  const promise = saveToIndexedDB(databaseRef.export())
    .catch((err: unknown) => {
      // Log error but don't throw – persistence failure shouldn't crash the app
      console.error('Failed to persist database:', err)
      const { error } = useToast()
      error('Failed to auto-save. Your recent changes may not be saved.')
    })
    .finally(() => {
      isPersisting = false
      currentPersistPromise = null

      // If writes occurred during persist, do another persist
      if (persistQueuedWhileBusy) {
        persistQueuedWhileBusy = false
        void executePersist()
      }
    })

  currentPersistPromise = promise
  await promise
}

/**
 * Immediately persist database (bypassing debounce).
 * Used when app is about to be suspended/hidden.
 */
export async function persistImmediately(): Promise<void> {
  // Cancel any pending debounced persist
  if (persistDebounceTimer) {
    clearTimeout(persistDebounceTimer)
    persistDebounceTimer = null
  }

  if (!databaseRef) return

  // Await any in-progress persist before writing, to avoid overwriting
  // in-flight data with a stale snapshot.
  if (currentPersistPromise) await currentPersistPromise

  await saveToIndexedDB(databaseRef.export())
}

/**
 * Synchronously persist database - last resort for beforeunload.
 */
export function persistSync(): void {
  if (!databaseRef) return
  saveToIndexedDBSync(databaseRef.export())
}
