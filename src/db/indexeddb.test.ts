/**
 * Tests for the IndexedDB persistence layer
 *
 * Covers the debounce, the one-persist-at-a-time queueing and the failure
 * toast. IndexedDB is replaced by a small in-memory fake.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type * as IndexedDbModule from './indexeddb'
import type { Database } from 'sql.js'

const mockError = vi.fn()

vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({ error: mockError })
}))

interface FakeStore {
  values: Map<string, unknown>
  puts: number
  failPuts: boolean
  putGate: Promise<void> | null
}

function installFakeIndexedDB(): FakeStore {
  const store: FakeStore = {
    values: new Map(),
    puts: 0,
    failPuts: false,
    putGate: null
  }

  const fakeConnection = {
    onclose: null,
    objectStoreNames: { contains: () => true },
    transaction: () => ({
      objectStore: () => ({
        put(value: unknown, key: string) {
          const request: {
            onsuccess: (() => void) | null
            onerror: (() => void) | null
            error: { message: string } | null
          } = { onsuccess: null, onerror: null, error: null }
          store.puts += 1
          void (store.putGate ?? Promise.resolve()).then(() => {
            if (store.failPuts) {
              request.error = { message: 'disk full' }
              request.onerror?.()
            } else {
              store.values.set(key, value)
              request.onsuccess?.()
            }
          })
          return request
        },
        get(key: string) {
          const request: {
            onsuccess: (() => void) | null
            onerror: (() => void) | null
            result: unknown
            error: null
          } = { onsuccess: null, onerror: null, result: undefined, error: null }
          void Promise.resolve().then(() => {
            request.result = store.values.get(key)
            request.onsuccess?.()
          })
          return request
        }
      })
    })
  }

  vi.stubGlobal('indexedDB', {
    open: () => {
      const request: {
        result: unknown
        onsuccess: (() => void) | null
        onerror: (() => void) | null
        onblocked: (() => void) | null
        onupgradeneeded: ((event: unknown) => void) | null
        error: null
      } = {
        result: fakeConnection,
        onsuccess: null,
        onerror: null,
        onblocked: null,
        onupgradeneeded: null,
        error: null
      }
      void Promise.resolve().then(() => request.onsuccess?.())
      return request
    }
  })

  return store
}

function fakeDatabase(bytes: number[] = [1, 2, 3]): Database {
  return { export: () => new Uint8Array(bytes) } as unknown as Database
}

async function loadModule(): Promise<typeof IndexedDbModule> {
  vi.resetModules()
  return import('./indexeddb')
}

describe('indexeddb persistence', () => {
  let store: FakeStore

  beforeEach(() => {
    vi.useFakeTimers()
    mockError.mockClear()
    store = installFakeIndexedDB()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does nothing when no database is set', async () => {
    const { schedulePersist } = await loadModule()

    schedulePersist()
    await vi.advanceTimersByTimeAsync(500)

    expect(store.puts).toBe(0)
  })

  it('groups rapid writes into one save after the debounce', async () => {
    const { schedulePersist, setDatabaseRef } = await loadModule()
    setDatabaseRef(fakeDatabase())

    schedulePersist()
    schedulePersist()
    schedulePersist()
    await vi.advanceTimersByTimeAsync(50)
    expect(store.puts).toBe(0)

    await vi.advanceTimersByTimeAsync(100)

    expect(store.puts).toBe(1)
    expect(store.values.get('db')).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('queues one more save for writes that arrive while a save is running', async () => {
    const { schedulePersist, setDatabaseRef } = await loadModule()
    setDatabaseRef(fakeDatabase())
    let release!: () => void
    store.putGate = new Promise<void>((resolve) => {
      release = resolve
    })

    schedulePersist()
    await vi.advanceTimersByTimeAsync(150)
    expect(store.puts).toBe(1)

    schedulePersist()
    await vi.advanceTimersByTimeAsync(150)
    expect(store.puts).toBe(1)

    release()
    await vi.advanceTimersByTimeAsync(0)

    expect(store.puts).toBe(2)
  })

  it('shows a toast when a scheduled save fails', async () => {
    const { schedulePersist, setDatabaseRef } = await loadModule()
    setDatabaseRef(fakeDatabase())
    store.failPuts = true

    schedulePersist()
    await vi.advanceTimersByTimeAsync(150)

    expect(mockError).toHaveBeenCalledWith(
      'Failed to auto-save. Your recent changes may not be saved.'
    )
  })

  it('persistImmediately cancels the pending debounce and saves once', async () => {
    const { persistImmediately, schedulePersist, setDatabaseRef } =
      await loadModule()
    setDatabaseRef(fakeDatabase())

    schedulePersist()
    await persistImmediately()
    await vi.advanceTimersByTimeAsync(500)

    expect(store.puts).toBe(1)
  })

  it('loadFromIndexedDB returns null when nothing is stored', async () => {
    const { loadFromIndexedDB } = await loadModule()

    await expect(loadFromIndexedDB()).resolves.toBeNull()
  })
})
