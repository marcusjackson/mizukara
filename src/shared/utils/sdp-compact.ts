/**
 * Binary compaction for `CompactSdpFields`, for carrying an SDP offer/answer
 * in a QR code or a short copy-paste code. Packs the varying SDP fields
 * (`utils/sdp-fields.ts` extracts them from real SDP text) into a small
 * byte buffer instead of JSON, then base64url-encodes that buffer — QR byte
 * mode and a paste field both want as few characters as possible, and a
 * fixed binary layout costs far fewer bytes than field names ever would.
 *
 * Layout (all multi-byte integers big-endian):
 * ```
 * 1 byte   header: bits 2      = kind (0 offer, 1 answer)
 *                  bits 0-1    = setup role (0 actpass, 1 active, 2 passive)
 * string   ufrag                (1-byte length prefix + UTF-8 bytes)
 * string   pwd                  (1-byte length prefix + UTF-8 bytes)
 * 32 bytes fingerprint           (raw SHA-256 digest)
 * 1 byte   candidate count
 * per candidate:
 *   1 byte   type (0 host, 1 srflx)
 *   string   address             (IPv4 literal or mDNS .local hostname)
 *   2 bytes  port
 *   srflx only:
 *     string   related address
 *     2 bytes  related port
 * ```
 */

import { SDP_SETUP_ROLES } from '@/shared/types/device-sync-types'

import type {
  CompactIceCandidate,
  CompactSdpFields,
  IceCandidateType,
  SdpKind,
  SdpSetupRole
} from '@/shared/types/device-sync-types'

const FINGERPRINT_BYTE_LENGTH = 32
const MAX_STRING_BYTES = 255
const MAX_CANDIDATE_COUNT = 255

const CANDIDATE_TYPES_BY_BITS: readonly IceCandidateType[] = ['host', 'srflx']

function setupBits(role: SdpSetupRole): number {
  const bits = SDP_SETUP_ROLES.indexOf(role)
  if (bits < 0) throw new Error(`Unsupported setup role: ${role}`)
  return bits
}

function candidateTypeBits(type: IceCandidateType): number {
  const bits = CANDIDATE_TYPES_BY_BITS.indexOf(type)
  if (bits < 0) throw new Error(`Unsupported candidate type: ${type}`)
  return bits
}

class ByteWriter {
  private readonly values: number[] = []

  pushByte(value: number): void {
    this.values.push(value & 0xff)
  }

  pushUint16(value: number): void {
    this.pushByte(value >> 8)
    this.pushByte(value)
  }

  pushBytes(bytes: Uint8Array): void {
    for (const byte of bytes) this.pushByte(byte)
  }

  pushString(value: string): void {
    const encoded = new TextEncoder().encode(value)
    if (encoded.length > MAX_STRING_BYTES) {
      throw new Error(`Value too long to compact: ${value}`)
    }
    this.pushByte(encoded.length)
    this.pushBytes(encoded)
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.values)
  }
}

class ByteReader {
  private offset = 0
  private readonly bytes: Uint8Array
  private readonly view: DataView

  constructor(bytes: Uint8Array) {
    this.bytes = bytes
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  readByte(): number {
    const value = this.view.getUint8(this.offset)
    this.offset += 1
    return value
  }

  readUint16(): number {
    const value = this.view.getUint16(this.offset)
    this.offset += 2
    return value
  }

  readBytes(length: number): Uint8Array {
    const value = this.bytes.subarray(this.offset, this.offset + length)
    if (value.length !== length) {
      throw new Error('Corrupt compact code: unexpected end of data')
    }
    this.offset += length
    return value
  }

  readString(): string {
    const length = this.readByte()
    return new TextDecoder().decode(this.readBytes(length))
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const padded = normalized + '='.repeat(paddingLength)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function writeCandidate(
  writer: ByteWriter,
  candidate: CompactIceCandidate
): void {
  writer.pushByte(candidateTypeBits(candidate.type))
  writer.pushString(candidate.address)
  writer.pushUint16(candidate.port)
  if (candidate.type !== 'srflx') return

  if (
    candidate.relatedAddress === undefined ||
    candidate.relatedPort === undefined
  ) {
    throw new Error('srflx candidate is missing its related address/port')
  }
  writer.pushString(candidate.relatedAddress)
  writer.pushUint16(candidate.relatedPort)
}

function readCandidate(reader: ByteReader): CompactIceCandidate {
  const type = CANDIDATE_TYPES_BY_BITS[reader.readByte()]
  if (type === undefined)
    throw new Error('Corrupt compact SDP: unknown candidate type')

  const address = reader.readString()
  const port = reader.readUint16()
  if (type !== 'srflx') return { address, port, type }

  const relatedAddress = reader.readString()
  const relatedPort = reader.readUint16()
  return { address, port, relatedAddress, relatedPort, type }
}

/** Packs SDP fields plus offer/answer kind into a short base64url string */
export function encodeCompactSdp(
  fields: CompactSdpFields,
  kind: SdpKind
): string {
  if (fields.fingerprint.length !== FINGERPRINT_BYTE_LENGTH) {
    throw new Error(
      `Fingerprint must be ${String(FINGERPRINT_BYTE_LENGTH)} bytes`
    )
  }
  if (fields.candidates.length > MAX_CANDIDATE_COUNT) {
    throw new Error(
      `Too many candidates to compact: ${String(fields.candidates.length)} (max ${String(MAX_CANDIDATE_COUNT)})`
    )
  }

  const writer = new ByteWriter()
  const kindBit = kind === 'answer' ? 1 : 0
  writer.pushByte((kindBit << 2) | setupBits(fields.setup))
  writer.pushString(fields.ufrag)
  writer.pushString(fields.pwd)
  writer.pushBytes(fields.fingerprint)
  writer.pushByte(fields.candidates.length)
  for (const candidate of fields.candidates) writeCandidate(writer, candidate)

  return toBase64Url(writer.toUint8Array())
}

/** Reverses `encodeCompactSdp`, recovering the offer/answer kind and fields */
export function decodeCompactSdp(encoded: string): {
  kind: SdpKind
  fields: CompactSdpFields
} {
  const reader = new ByteReader(fromBase64Url(encoded))
  const header = reader.readByte()
  const kind: SdpKind = (header >> 2) & 1 ? 'answer' : 'offer'
  const setup = SDP_SETUP_ROLES[header & 0b11]
  if (setup === undefined)
    throw new Error('Corrupt compact SDP: unknown setup role')

  const ufrag = reader.readString()
  const pwd = reader.readString()
  const fingerprint = reader.readBytes(FINGERPRINT_BYTE_LENGTH)
  const candidateCount = reader.readByte()
  const candidates = Array.from({ length: candidateCount }, () =>
    readCandidate(reader)
  )

  return { fields: { candidates, fingerprint, pwd, setup, ufrag }, kind }
}
