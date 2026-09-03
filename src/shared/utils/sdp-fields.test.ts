import { describe, expect, it } from 'vitest'

import { buildSdp, extractSdpFields } from './sdp-fields'

import type { CompactSdpFields } from '@/shared/types/device-sync-types'

const SAMPLE_OFFER_SDP = [
  'v=0',
  'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'a=msid-semantic: WMS',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
  'c=IN IP4 0.0.0.0',
  'a=ice-ufrag:4ZzA',
  'a=ice-pwd:9Cvw2s1JqzE6b3d0FhP4x7Rt',
  'a=ice-options:trickle',
  'a=fingerprint:sha-256 AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34',
  'a=setup:actpass',
  'a=mid:0',
  'a=sctp-port:5000',
  'a=max-message-size:262144',
  'a=candidate:1 1 udp 2122260223 8f3e1b4a-2c9d-4e11-9a6b-3f7c1d0a5e2b.local 54321 typ host generation 0 ufrag 4ZzA network-id 1',
  'a=candidate:2 1 udp 1685987071 203.0.113.10 54322 typ srflx raddr 192.168.1.5 rport 54322 generation 0 ufrag 4ZzA network-id 1',
  'a=end-of-candidates',
  ''
].join('\r\n')

describe('extractSdpFields', () => {
  it('extracts ICE credentials, fingerprint, and setup role', () => {
    const fields = extractSdpFields(SAMPLE_OFFER_SDP)

    expect(fields.ufrag).toBe('4ZzA')
    expect(fields.pwd).toBe('9Cvw2s1JqzE6b3d0FhP4x7Rt')
    expect(fields.setup).toBe('actpass')
    expect(fields.fingerprint).toHaveLength(32)
    expect(fields.fingerprint[0]).toBe(0xab)
    expect(fields.fingerprint[1]).toBe(0xcd)
  })

  it('extracts a host candidate with an mDNS-obfuscated address', () => {
    const fields = extractSdpFields(SAMPLE_OFFER_SDP)

    const host = fields.candidates.find((c) => c.type === 'host')
    expect(host).toEqual({
      address: '8f3e1b4a-2c9d-4e11-9a6b-3f7c1d0a5e2b.local',
      port: 54321,
      type: 'host'
    })
  })

  it('extracts a srflx candidate with its related address/port', () => {
    const fields = extractSdpFields(SAMPLE_OFFER_SDP)

    const srflx = fields.candidates.find((c) => c.type === 'srflx')
    expect(srflx).toEqual({
      address: '203.0.113.10',
      port: 54322,
      relatedAddress: '192.168.1.5',
      relatedPort: 54322,
      type: 'srflx'
    })
  })

  it('throws when a required line is missing', () => {
    const withoutUfrag = SAMPLE_OFFER_SDP.replace(/^a=ice-ufrag:.+$\r\n/m, '')

    expect(() => extractSdpFields(withoutUfrag)).toThrow(/ice-ufrag/)
  })
})

describe('buildSdp', () => {
  it('round-trips through extractSdpFields', () => {
    const original = extractSdpFields(SAMPLE_OFFER_SDP)

    const rebuilt = buildSdp(original)
    const reExtracted = extractSdpFields(rebuilt)

    expect(reExtracted).toEqual(original)
  })

  it('omits raddr/rport for host candidates', () => {
    const fields: CompactSdpFields = {
      candidates: [{ address: 'abc.local', port: 1111, type: 'host' }],
      fingerprint: new Uint8Array(32),
      pwd: 'pwd',
      setup: 'active',
      ufrag: 'ufrag'
    }

    const sdp = buildSdp(fields)

    expect(sdp).toContain('typ host generation 0 ufrag ufrag')
    expect(sdp).not.toContain('raddr')
  })

  it('produces a candidate-free session when there are no candidates', () => {
    const fields: CompactSdpFields = {
      candidates: [],
      fingerprint: new Uint8Array(32),
      pwd: 'pwd',
      setup: 'passive',
      ufrag: 'ufrag'
    }

    const sdp = buildSdp(fields)

    expect(sdp).not.toContain('a=candidate:')
    expect(sdp).toContain('a=end-of-candidates')
  })
})
