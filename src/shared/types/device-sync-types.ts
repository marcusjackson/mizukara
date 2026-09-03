/**
 * Device Sync Types
 *
 * Shared types for the peer-to-peer device sync transport and signaling
 * layer. See docs/units/device-sync/atlas.md for the shipped design.
 */

/** Which side of a pairing exchange this device is playing */
export type DeviceSyncRole = 'initiator' | 'responder'

/** Which half of the SDP offer/answer exchange a compacted payload carries */
export type SdpKind = 'offer' | 'answer'

/** ICE candidate types this app gathers — host (mDNS-obfuscated) and STUN-derived srflx. No relay: no TURN server is configured. */
export type IceCandidateType = 'host' | 'srflx'

/** DTLS role the `a=setup` SDP attribute negotiates for a session description */
export type SdpSetupRole = 'actpass' | 'active' | 'passive'

/**
 * The full `SdpSetupRole` value set, as an ordered array. Shared by
 * `utils/sdp-fields.ts` (text validation) and `utils/sdp-compact.ts` (bit
 * packing, where the array index *is* the wire encoding) so the two stay in
 * sync by construction instead of by two independently maintained arrays.
 */
export const SDP_SETUP_ROLES: readonly SdpSetupRole[] = [
  'actpass',
  'active',
  'passive'
]

/**
 * One ICE candidate reduced to the fields needed to reconstruct a working
 * `a=candidate` SDP line. `address` may be an IPv4 literal (srflx) or an
 * mDNS `.local` hostname (host, per the browser's default obfuscation) —
 * never assume it parses as an IP.
 */
export interface CompactIceCandidate {
  type: IceCandidateType
  address: string
  port: number
  relatedAddress?: string
  relatedPort?: number
}

/**
 * The subset of an SDP offer/answer that actually varies between peers and
 * sessions. Everything else in a data-channel-only SDP is boilerplate this
 * app regenerates identically on both sides — see `utils/sdp-compact.ts`.
 */
export interface CompactSdpFields {
  ufrag: string
  pwd: string
  /** Raw SHA-256 fingerprint digest bytes (32 bytes), not the colon-hex text form */
  fingerprint: Uint8Array
  setup: SdpSetupRole
  candidates: CompactIceCandidate[]
}
