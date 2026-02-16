/**
 * Tests for useDatabase composable
 *
 * These tests verify the database composable's core functionality.
 * Note: Since this composable uses IndexedDB (not available in jsdom),
 * we test the synchronous parts and mock the persistence layer.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock IndexedDB since it's not available in jsdom
const mockIDBStore = new Map<string, Uint8Array>()

const mockIndexedDB = {
  open: vi.fn(() => {
    const request = {
      result: {
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
        transaction: () => ({
          objectStore: () => ({
            get: (key: string) => {
              const req = {
                result: mockIDBStore.get(key),
                onerror: null as (() => void) | null,
                onsuccess: null as (() => void) | null
              }
              setTimeout(() => req.onsuccess?.(), 0)
              return req
            },
            put: (data: Uint8Array, key: string) => {
              mockIDBStore.set(key, data)
              const req = {
                onerror: null as (() => void) | null,
                onsuccess: null as (() => void) | null
              }
              setTimeout(() => req.onsuccess?.(), 0)
              return req
            }
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
