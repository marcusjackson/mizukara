/**
 * Tests for database initialization
 *
 * Covers the synchronous validation logic in replaceDatabaseWithImported
 * without loading the sql.js WASM binary.
 */

import { describe, expect, it } from 'vitest'

import { replaceDatabaseWithImported } from './init'

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
