import { describe, expect, it } from 'vitest'

import { decodeCompactSdp, encodeCompactSdp } from './sdp-compact'

import type { CompactSdpFields } from '@/shared/types/device-sync-types'

function makeFields(
  overrides: Partial<CompactSdpFields> = {}
): CompactSdpFields {
  return {
    candidates: [
      {
        address: '8f3e1b4a-2c9d-4e11-9a6b-3f7c1d0a5e2b.local',
        port: 54321,
        type: 'host'
      },
      {
        address: '203.0.113.10',
        port: 54322,
        relatedAddress: '192.168.1.5',
        relatedPort: 54322,
        type: 'srflx'
      }
    ],
    fingerprint: Uint8Array.from({ length: 32 }, (_, i) => i * 7 + 1),
    pwd: '9Cvw2s1JqzE6b3d0FhP4x7Rt',
    setup: 'actpass',
    ufrag: '4ZzA',
    ...overrides
  }
}

describe('encodeCompactSdp / decodeCompactSdp', () => {
  it('round-trips fields and kind for an offer', () => {
    const fields = makeFields()

    const encoded = encodeCompactSdp(fields, 'offer')
    const decoded = decodeCompactSdp(encoded)

    expect(decoded.kind).toBe('offer')
    expect(decoded.fields).toEqual(fields)
  })

  it('round-trips fields and kind for an answer', () => {
    const fields = makeFields({ setup: 'active' })

    const encoded = encodeCompactSdp(fields, 'answer')
    const decoded = decodeCompactSdp(encoded)

    expect(decoded.kind).toBe('answer')
    expect(decoded.fields.setup).toBe('active')
  })

  it('round-trips a passive setup role', () => {
    const fields = makeFields({ setup: 'passive' })

    const decoded = decodeCompactSdp(encodeCompactSdp(fields, 'answer'))

    expect(decoded.fields.setup).toBe('passive')
  })

  it('round-trips with no candidates', () => {
    const fields = makeFields({ candidates: [] })

    const decoded = decodeCompactSdp(encodeCompactSdp(fields, 'offer'))

    expect(decoded.fields.candidates).toEqual([])
  })

  it('round-trips multiple host candidates without related address fields', () => {
    const fields = makeFields({
      candidates: [
        { address: 'aaaa.local', port: 1, type: 'host' },
        { address: 'bbbb.local', port: 2, type: 'host' }
      ]
    })

    const decoded = decodeCompactSdp(encodeCompactSdp(fields, 'offer'))

    expect(decoded.fields.candidates).toEqual(fields.candidates)
  })

  it('produces a URL-safe string with no padding characters', () => {
    const encoded = encodeCompactSdp(makeFields(), 'offer')

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('produces a compact enough payload for a QR/paste code', () => {
    const encoded = encodeCompactSdp(makeFields(), 'offer')

    // A phone camera scans QR byte-mode payloads well under a few hundred
    // characters reliably; this is well inside that budget even with two
    // candidates and a 24-char ICE password.
    expect(encoded.length).toBeLessThan(200)
  })

  it('rejects a fingerprint that is not 32 bytes', () => {
    const fields = makeFields({ fingerprint: new Uint8Array(16) })

    expect(() => encodeCompactSdp(fields, 'offer')).toThrow(/32 bytes/)
  })

  it('rejects a srflx candidate missing its related address', () => {
    const fields = makeFields({
      candidates: [{ address: '203.0.113.10', port: 1, type: 'srflx' }]
    })

    expect(() => encodeCompactSdp(fields, 'offer')).toThrow(/related/)
  })

  it('rejects more than 255 candidates instead of silently wrapping the count byte', () => {
    const fields = makeFields({
      candidates: Array.from({ length: 256 }, (_, i) => ({
        address: `${String(i)}.local`,
        port: 1,
        type: 'host' as const
      }))
    })

    expect(() => encodeCompactSdp(fields, 'offer')).toThrow(/256/)
  })

  it('throws instead of silently truncating a corrupted/truncated code', () => {
    // header byte, then a string length prefix of 4 claiming 4 bytes follow,
    // but only 2 are actually present — a truncated/mistyped paste code.
    const truncatedBytes = Uint8Array.from([0, 4, 0x34, 0x5a])
    let binary = ''
    for (const byte of truncatedBytes) binary += String.fromCharCode(byte)
    const encoded = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    expect(() => decodeCompactSdp(encoded)).toThrow(/unexpected end of data/)
  })
})
