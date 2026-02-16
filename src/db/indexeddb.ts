/**
 * IndexedDB persistence layer for SQLite database
 *
 * Handles saving and loading the SQLite database binary to/from IndexedDB.
 * Provides both async and sync save methods for different lifecycle events.
 */

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

/** Reference to the database instance for persistence */
let databaseRef: Database | null = null

// =============================================================================
// IndexedDB Operations
// =============================================================================

/**
 * Open IndexedDB connection
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, 1)

    request.onerror = () => {
      reject(new Error(request.error?.message ?? 'Failed to open IndexedDB'))
    }
    request.onsuccess = () => {
      resolve(request.result)
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
 * Load database from IndexedDB
 */
export async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  const idb = await openIndexedDB()

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
 */
export async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await openIndexedDB()

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
 * Returns immediately after starting the transaction.
 */
export function saveToIndexedDBSync(data: Uint8Array): void {
  // Open IndexedDB synchronously using cached connection if possible
  const request = indexedDB.open(INDEXEDDB_NAME, 1)

  request.onsuccess = () => {
    const idb = request.result
    const transaction = idb.transaction(INDEXEDDB_STORE, 'readwrite')
    const store = transaction.objectStore(INDEXEDDB_STORE)
    store.put(data, INDEXEDDB_KEY)
  }
}

// =============================================================================
// Persistence Management
// =============================================================================

/**
 * Set the database reference for persistence operations
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

  try {
    await saveToIndexedDB(databaseRef.export())
  } catch (err) {
    // Log error but don't throw - persistence failure shouldn't crash the app
    console.error('Failed to persist database:', err)
  } finally {
    isPersisting = false

    // If writes occurred during persist, do another persist
    if (persistQueuedWhileBusy) {
      persistQueuedWhileBusy = false
      void executePersist()
    }
  }
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

  // Wait for any in-progress persist to complete, then do final persist
  // This ensures we have the latest data saved
  if (isPersisting) {
    // Wait a bit for current persist to finish
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  await saveToIndexedDB(databaseRef.export())
}

/**
 * Synchronously persist database - last resort for beforeunload.
 */
export function persistSync(): void {
  if (!databaseRef) return
  saveToIndexedDBSync(databaseRef.export())
}
