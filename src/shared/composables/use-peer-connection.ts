/**
 * usePeerConnection
 *
 * Wraps a single `RTCPeerConnection`/`RTCDataChannel` pair for one device
 * sync session: ICE config (STUN only, no TURN), offer/answer creation
 * against the compact SDP codes exchanged over QR/paste, and connection
 * lifecycle. The connection is ephemeral — create a fresh instance per sync
 * attempt via `usePeerConnection()`, never reuse one across sessions.
 *
 * @example
 * ```ts
 * // Initiator
 * const peer = usePeerConnection()
 * const offerCode = await peer.createOffer()
 * // ...show offerCode as a QR code, scan back the answer code...
 * await peer.acceptAnswer(answerCode)
 *
 * // Responder
 * const peer = usePeerConnection()
 * const answerCode = await peer.createAnswer(offerCode)
 * // ...show answerCode as a QR code...
 * ```
 */

import { markRaw, onScopeDispose, readonly, shallowRef } from 'vue'

import {
  buildIceServers,
  gatherLocalSdp
} from '@/shared/utils/rtc-peer-signaling'
import { decodeCompactSdp, encodeCompactSdp } from '@/shared/utils/sdp-compact'
import { buildSdp, extractSdpFields } from '@/shared/utils/sdp-fields'

import type { DeepReadonly, Ref, ShallowRef } from 'vue'

const DATA_CHANNEL_LABEL = 'mizukara-device-sync'

export interface UsePeerConnection {
  /** Current `RTCPeerConnection` connection state */
  connectionState: DeepReadonly<Ref<RTCPeerConnectionState>>
  /** The data channel once open — created locally (initiator) or received from the peer (responder) */
  dataChannel: DeepReadonly<ShallowRef<RTCDataChannel | null>>
  /** Initiator: create an offer, wait for ICE gathering, return its compact code */
  createOffer: () => Promise<string>
  /** Responder: consume an offer code, return the compact code for the resulting answer */
  createAnswer: (compactOffer: string) => Promise<string>
  /** Initiator: consume the responder's answer code, completing the handshake */
  acceptAnswer: (compactAnswer: string) => Promise<void>
  /**
   * Gracefully closes the data channel, then the connection. Waits for the
   * channel's own close handshake with the peer to finish (see
   * `closeChannelGracefully`) before tearing down the connection, so any
   * already-`send()`-ed data actually reaches the peer first. Safe to call
   * multiple times.
   */
  close: () => Promise<void>
}

function assertKind(
  actual: 'offer' | 'answer',
  expected: 'offer' | 'answer'
): void {
  if (actual !== expected) {
    throw new Error(
      `Expected an SDP "${expected}" code but received a "${actual}" code`
    )
  }
}

/**
 * Only publishes the channel once its `readyState` is actually `'open'`.
 * `RTCPeerConnection.connectionState` reaching `'connected'` (ICE + DTLS up)
 * does not guarantee the data channel's own SCTP handshake has finished —
 * publishing the channel object the instant it exists (as soon as
 * `createDataChannel` returns, for the initiator) lets a caller observe a
 * channel that then rejects every `send()` for a few milliseconds to
 * occasionally much longer. Waiting for `'open'` here means "dataChannel is
 * non-null" is a true readiness signal everywhere else in the sync flow,
 * not just "the object exists".
 */
function publishOnceOpen(
  channel: RTCDataChannel,
  dataChannel: ShallowRef<RTCDataChannel | null>
): void {
  channel.binaryType = 'arraybuffer'
  if (channel.readyState === 'open') {
    dataChannel.value = markRaw(channel)
    return
  }
  channel.addEventListener(
    'open',
    () => {
      dataChannel.value = markRaw(channel)
    },
    { once: true }
  )
}

/**
 * `RTCDataChannel.close()` performs a graceful closing procedure — an SCTP
 * stream-reset handshake with the peer that only completes once any data
 * already handed to `send()` has actually been delivered, not just drained
 * from the local buffer. Calling `RTCPeerConnection.close()` immediately
 * after `channel.close()` (without waiting for the channel's own `'close'`
 * event) throws that guarantee away — the abrupt connection teardown can
 * race ahead of the handshake and cut off data that was already "sent" from
 * the caller's point of view. This waits for the channel to actually finish
 * closing (or a bounded fallback if the peer never acknowledges, e.g.
 * because it already vanished) before the caller proceeds to `pc.close()`.
 */
const GRACEFUL_CLOSE_TIMEOUT_MS = 3_000

function closeChannelGracefully(
  maybeChannel: RTCDataChannel | null
): Promise<void> {
  if (!maybeChannel || maybeChannel.readyState === 'closed') {
    return Promise.resolve()
  }
  const channel = maybeChannel

  return new Promise((resolve) => {
    let settled = false
    function finish(): void {
      if (settled) return
      settled = true
      channel.removeEventListener('close', finish)
      resolve()
    }
    channel.addEventListener('close', finish)
    setTimeout(finish, GRACEFUL_CLOSE_TIMEOUT_MS)
    channel.close()
  })
}

function attachPeerConnectionListeners(
  pc: RTCPeerConnection,
  connectionState: ShallowRef<RTCPeerConnectionState>,
  onDataChannel: (channel: RTCDataChannel) => void
): void {
  pc.addEventListener('connectionstatechange', () => {
    connectionState.value = pc.connectionState
  })
  pc.addEventListener('datachannel', (event) => {
    onDataChannel(event.channel)
  })
}

export function usePeerConnection(): UsePeerConnection {
  const pc = new RTCPeerConnection({ iceServers: buildIceServers() })
  const connectionState = shallowRef<RTCPeerConnectionState>(pc.connectionState)
  const dataChannel = shallowRef<RTCDataChannel | null>(null)

  function setDataChannel(channel: RTCDataChannel): void {
    publishOnceOpen(channel, dataChannel)
  }

  attachPeerConnectionListeners(pc, connectionState, setDataChannel)

  async function createOffer(): Promise<string> {
    setDataChannel(pc.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true }))
    const offer = await pc.createOffer()
    const sdp = await gatherLocalSdp(pc, offer)
    return encodeCompactSdp(extractSdpFields(sdp), 'offer')
  }

  async function createAnswer(compactOffer: string): Promise<string> {
    const { fields, kind } = decodeCompactSdp(compactOffer)
    assertKind(kind, 'offer')

    await pc.setRemoteDescription({ sdp: buildSdp(fields), type: 'offer' })
    const answer = await pc.createAnswer()
    const sdp = await gatherLocalSdp(pc, answer)
    return encodeCompactSdp(extractSdpFields(sdp), 'answer')
  }

  async function acceptAnswer(compactAnswer: string): Promise<void> {
    const { fields, kind } = decodeCompactSdp(compactAnswer)
    assertKind(kind, 'answer')

    await pc.setRemoteDescription({ sdp: buildSdp(fields), type: 'answer' })
  }

  async function close(): Promise<void> {
    const channel = dataChannel.value
    dataChannel.value = null
    await closeChannelGracefully(channel)
    pc.close()
    connectionState.value = 'closed'
  }

  onScopeDispose(() => {
    void close()
  })

  return {
    acceptAnswer,
    close,
    connectionState: readonly(connectionState),
    createAnswer,
    createOffer,
    dataChannel: readonly(dataChannel)
  }
}
