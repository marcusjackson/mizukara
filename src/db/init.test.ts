/**
 * Tests for database initialization
 *
 * Covers the validation logic and persistence order of replaceDatabaseWithImported
 * without loading the sql.js WASM binary.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { replaceDatabaseWithImported } from './init'

const mockSaveToIndexedDB = vi.fn<(data: Uint8Array) => Promise<void>>()
const mockSetDatabaseRef = vi.fn()
const mockClose = vi.fn()

vi.mock('./indexeddb', () => ({
  loadFromIndexedDB: vi.fn(),
  saveToIndexedDB: (data: Uint8Array): Promise<void> =>
    mockSaveToIndexedDB(data),
  setDatabaseRef: (db: unknown) => {
    mockSetDatabaseRef(db)
  },
  attachLifecycleListeners: vi.fn()
}))

vi.mock('./migrations', () => ({ runMigrations: vi.fn() }))

vi.mock('sql.js', () => ({
  default: () =>
    Promise.resolve({
      Database: class {
        export = () => new Uint8Array(1)
        close = mockClose
      }
    })
}))

describe('replaceDatabaseWithImported', () => {
  describe('SQLite magic byte validation', () => {
    it('rejects data that is too short', async () => {
      const shortData = new Uint8Array([0x53, 0x51, 0x4c]) // only 3 bytes

      await expect(replaceDatabaseWithImported(shortData)).rejects.toThrow(
        'Invalid file: not a SQLite database'
      )
    })

    it('rejects data that starts with wrong magic bytes', async () => {
      const wrongMagic = new Uint8Array(16).fill(0xff) // wrong magic header

      await expect(replaceDatabaseWithImported(wrongMagic)).rejects.toThrow(
        'Invalid file: not a SQLite database'
      )
    })

    it('rejects a JPEG-like header (0xff 0xd8 0xff)', async () => {
      const jpegHeader = new Uint8Array(16)
      jpegHeader[0] = 0xff
      jpegHeader[1] = 0xd8
      jpegHeader[2] = 0xff

      await expect(replaceDatabaseWithImported(jpegHeader)).rejects.toThrow(
        'Invalid file: not a SQLite database'
      )
    })

    it('rejects empty data', async () => {
      const emptyData = new Uint8Array(0)

      await expect(replaceDatabaseWithImported(emptyData)).rejects.toThrow(
        'Invalid file: not a SQLite database'
      )
    })
  })
})

describe('replaceDatabaseWithImported persistence order', () => {
  const validHeader = new Uint8Array(16)
  validHeader.set([0x53, 0x51, 0x4c, 0x69, 0x74, 0x65])

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('points persistence at the new database only after the save succeeds', async () => {
    mockSaveToIndexedDB.mockResolvedValue(undefined)

    await replaceDatabaseWithImported(validHeader)

    expect(mockSetDatabaseRef).toHaveBeenCalledOnce()
    expect(mockSaveToIndexedDB.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetDatabaseRef.mock.invocationCallOrder[0] ?? 0
    )
  })

  it('leaves the persistence target alone and closes the new database when the save fails', async () => {
    mockSaveToIndexedDB.mockRejectedValue(new Error('quota exceeded'))

    await expect(replaceDatabaseWithImported(validHeader)).rejects.toThrow(
      'quota exceeded'
    )

    expect(mockSetDatabaseRef).not.toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalledOnce()
  })
})
