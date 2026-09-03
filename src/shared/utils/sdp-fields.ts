/**
 * SDP field extraction/reconstruction for data-channel-only sessions.
 *
 * A browser-generated offer/answer SDP for a single `RTCDataChannel` is
 * mostly fixed boilerplate — only a handful of lines actually differ between
 * peers and sessions (ICE credentials, the DTLS fingerprint, the setup role,
 * and the gathered candidates). `extractSdpFields` pulls just those out;
 * `buildSdp` regenerates a spec-shaped SDP from them on the receiving side.
 * `utils/sdp-compact.ts` packs the extracted fields into the short string a
 * QR code or copy-paste code carries.
 */

import { SDP_SETUP_ROLES } from '@/shared/types/device-sync-types'

import type {
  CompactIceCandidate,
  CompactSdpFields,
  IceCandidateType,
  SdpSetupRole
} from '@/shared/types/device-sync-types'

function extractLine(sdp: string, pattern: RegExp): string {
  const match = pattern.exec(sdp)
  const value = match?.[1]
  if (value === undefined) {
    throw new Error(`SDP is missing a line matching ${pattern.source}`)
  }
  return value
}

function fingerprintTextToBytes(text: string): Uint8Array {
  const hexPairs = text.split(':')
  return Uint8Array.from(hexPairs.map((pair) => Number.parseInt(pair, 16)))
}

function fingerprintBytesToText(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(':')
}

function parseSetupRole(value: string): SdpSetupRole {
  if (!SDP_SETUP_ROLES.includes(value as SdpSetupRole)) {
    throw new Error(`Unsupported SDP setup role: ${value}`)
  }
  return value as SdpSetupRole
}

function parseCandidateType(value: string): IceCandidateType | null {
  return value === 'host' || value === 'srflx' ? value : null
}

/** Parses one `a=candidate:...` line body (without the `a=candidate:` prefix) */
function parseCandidateLine(line: string): CompactIceCandidate | null {
  const tokens = line.split(' ')
  const [, , , , address, portText] = tokens
  const typeIndex = tokens.indexOf('typ')
  const rawType = typeIndex >= 0 ? tokens[typeIndex + 1] : undefined
  const type = rawType === undefined ? null : parseCandidateType(rawType)
  if (address === undefined || portText === undefined || type === null) {
    return null
  }

  const candidate: CompactIceCandidate = {
    address,
    port: Number(portText),
    type
  }
  const raddrIndex = tokens.indexOf('raddr')
  const rportIndex = tokens.indexOf('rport')
  const relatedAddress = raddrIndex >= 0 ? tokens[raddrIndex + 1] : undefined
  const relatedPort = rportIndex >= 0 ? tokens[rportIndex + 1] : undefined
  if (relatedAddress !== undefined && relatedPort !== undefined) {
    return { ...candidate, relatedAddress, relatedPort: Number(relatedPort) }
  }
  return candidate
}

function extractCandidates(sdp: string): CompactIceCandidate[] {
  const lines = sdp.match(/^a=candidate:(.+)$/gm) ?? []
  return lines
    .map((line) => parseCandidateLine(line.replace('a=candidate:', '')))
    .filter((candidate): candidate is CompactIceCandidate => candidate !== null)
}

/**
 * Extracts the peer/session-varying fields out of a full SDP offer or
 * answer, as produced by `RTCPeerConnection` after ICE gathering completes.
 */
export function extractSdpFields(sdp: string): CompactSdpFields {
  const ufrag = extractLine(sdp, /^a=ice-ufrag:(.+)$/m)
  const pwd = extractLine(sdp, /^a=ice-pwd:(.+)$/m)
  const fingerprintText = extractLine(sdp, /^a=fingerprint:sha-256 (.+)$/m)
  const setup = parseSetupRole(extractLine(sdp, /^a=setup:(.+)$/m))
  const candidates = extractCandidates(sdp)

  return {
    candidates,
    fingerprint: fingerprintTextToBytes(fingerprintText),
    pwd,
    setup,
    ufrag
  }
}

const HOST_CANDIDATE_BASE_PRIORITY = 2122260223
const SRFLX_CANDIDATE_BASE_PRIORITY = 1685987071

function candidatePriority(type: IceCandidateType, index: number): number {
  const base =
    type === 'host'
      ? HOST_CANDIDATE_BASE_PRIORITY
      : SRFLX_CANDIDATE_BASE_PRIORITY
  return base - index
}

function buildCandidateLine(
  candidate: CompactIceCandidate,
  index: number,
  ufrag: string
): string {
  const priority = String(candidatePriority(candidate.type, index))
  const related =
    candidate.relatedAddress !== undefined &&
    candidate.relatedPort !== undefined
      ? ` raddr ${candidate.relatedAddress} rport ${String(candidate.relatedPort)}`
      : ''
  return (
    `a=candidate:f${String(index)} 1 udp ${priority} ${candidate.address} ` +
    `${String(candidate.port)} typ ${candidate.type}${related} generation 0 ` +
    `ufrag ${ufrag} network-id 1`
  )
}

/**
 * Rebuilds a full data-channel-only SDP offer/answer from extracted fields.
 * The boilerplate lines match what `RTCPeerConnection` itself generates for
 * a single-data-channel session, so the result is what the other extraction
 * side would have produced with these same field values. The offer/answer
 * distinction lives entirely in `fields.setup` and in the `type` passed
 * alongside this text to `setLocalDescription`/`setRemoteDescription` — nothing
 * else in the SDP body differs between the two.
 */
export function buildSdp(fields: CompactSdpFields): string {
  const lines = [
    'v=0',
    'o=- 0 0 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    'a=group:BUNDLE 0',
    'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    `a=ice-ufrag:${fields.ufrag}`,
    `a=ice-pwd:${fields.pwd}`,
    'a=ice-options:trickle',
    `a=fingerprint:sha-256 ${fingerprintBytesToText(fields.fingerprint)}`,
    `a=setup:${fields.setup}`,
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
    ...fields.candidates.map((candidate, index) =>
      buildCandidateLine(candidate, index, fields.ufrag)
    ),
    'a=end-of-candidates'
  ]
  return `${lines.join('\r\n')}\r\n`
}
