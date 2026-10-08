/**
 * Tests for useDatabase composable
 *
 * These tests verify the database composable's core functionality.
 * Note: Since this composable uses IndexedDB (not available in jsdom),
 * we test the synchronous parts and mock the persistence layer.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Database } from 'sql.js'

// Mock IndexedDB since it's not available in jsdom
const mockIDBStore = new Map<string, Uint8Array>()

interface IDBRequestLike {
  result?: Uint8Array | undefined
  onerror: (() => void) | null
  onsuccess: (() => void) | null
}

function mockIDBGet(key: string): IDBRequestLike {
  const req: IDBRequestLike = {
    result: mockIDBStore.get(key),
    onerror: null,
    onsuccess: null
  }
  setTimeout(() => req.onsuccess?.(), 0)
  return req
}

function mockIDBPut(data: Uint8Array, key: string): IDBRequestLike {
  mockIDBStore.set(key, data)
  const req: IDBRequestLike = { onerror: null, onsuccess: null }
  setTimeout(() => req.onsuccess?.(), 0)
  return req
}

const mockIndexedDB = {
  open: vi.fn(() => {
    const request = {
      result: {
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
        transaction: () => ({
          objectStore: () => ({
            get: mockIDBGet,
            put: mockIDBPut
          })
        })
      },
      onerror: null as (() => void) | null,
      onsuccess: null as (() => void) | null,
      onupgradeneeded: null as (() => void) | null
    }
    setTimeout(() => request.onsuccess?.(), 0)
    return request
  })
}

vi.stubGlobal('indexedDB', mockIndexedDB)

// Import after mocking
import { useDatabase } from './use-database'

describe('useDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIDBStore.clear()

    // Reset module state by re-importing
    vi.resetModules()
  })

  it('returns the expected interface', () => {
    const db = useDatabase()

    expect(db).toHaveProperty('initialize')
    expect(db).toHaveProperty('exec')
    expect(db).toHaveProperty('run')
    expect(db).toHaveProperty('isInitialized')
    expect(db).toHaveProperty('isInitializing')
    expect(db).toHaveProperty('initError')
    expect(db).toHaveProperty('persist')
  })

  it('isInitialized is false initially', () => {
    const db = useDatabase()

    expect(db.isInitialized.value).toBe(false)
  })

  it('isInitializing is false initially', () => {
    const db = useDatabase()

    expect(db.isInitializing.value).toBe(false)
  })

  it('initError is null initially', () => {
    const db = useDatabase()

    expect(db.initError.value).toBeNull()
  })

  describe('exec and run before initialization', () => {
    it('exec throws error if called before initialization', () => {
      const db = useDatabase()

      expect(() => {
        db.exec('SELECT 1')
      }).toThrow('Database not initialized')
    })

    it('run throws error if called before initialization', () => {
      const db = useDatabase()

      expect(() => {
        db.run('SELECT 1')
      }).toThrow('Database not initialized')
    })
  })
})

describe('useDatabase replaceDatabase', () => {
  const mockInitializeDatabase = vi.fn()
  const mockReplaceDatabaseWithImported = vi.fn()

  function fakeDatabase(): Database {
    return {
      close: vi.fn(),
      exec: vi.fn(),
      run: vi.fn()
    } as unknown as Database
  }

  async function loadWithMockedInit() {
    vi.resetModules()
    vi.doMock('@/db/init', () => ({
      initializeDatabase: mockInitializeDatabase,
      replaceDatabaseWithImported: mockReplaceDatabaseWithImported
    }))
    const { useDatabase: freshUseDatabase } = await import('./use-database')
    return freshUseDatabase()
  }

  it('keeps the current database open when the import is refused', async () => {
    const current = fakeDatabase()
    mockInitializeDatabase.mockResolvedValue(current)
    mockReplaceDatabaseWithImported.mockRejectedValue(
      new Error('saved by a newer version')
    )
    const db = await loadWithMockedInit()
    await db.initialize()

    await expect(db.replaceDatabase(new Uint8Array(16))).rejects.toThrow(
      'saved by a newer version'
    )

    expect(current.close).not.toHaveBeenCalled()
    expect(db.database.value).toBe(current)
  })

  it('closes the old database once the import has loaded', async () => {
    const current = fakeDatabase()
    const imported = fakeDatabase()
    mockInitializeDatabase.mockResolvedValue(current)
    mockReplaceDatabaseWithImported.mockResolvedValue(imported)
    const db = await loadWithMockedInit()
    await db.initialize()

    await db.replaceDatabase(new Uint8Array(16))

    expect(current.close).toHaveBeenCalledOnce()
    expect(db.database.value).toBe(imported)
  })
})
