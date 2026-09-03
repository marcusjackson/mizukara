/**
 * useDeviceSyncPairing
 *
 * Drives the mutual-QR/copy-paste pairing flow on top of
 * `usePeerConnection`: an initiator produces an offer code to share and
 * consumes the responder's answer code; a responder consumes an offer code
 * and produces an answer code to share back. Doesn't care whether a code
 * arrived via QR scan or paste — both feed the same `submitCode`.
 *
 * @example
 * ```ts
 * const pairing = useDeviceSyncPairing('initiator')
 * await pairing.start()
 * // ...display pairing.code.value as a QR code...
 * await pairing.submitCode(scannedAnswerCode)
 * // pairing.phase.value becomes 'connected' once ICE negotiation finishes
 * ```
 */

import { readonly, ref, watch } from 'vue'

import { usePeerConnection } from '@/shared/composables/use-peer-connection'

import type { DeviceSyncRole } from '@/shared/types/device-sync-types'
import type { DeepReadonly, Ref, ShallowRef } from 'vue'

function applyError(
  phase: Ref<DeviceSyncPairingPhase>,
  error: Ref<string | null>,
  err: unknown,
  fallback: string
): void {
  error.value = err instanceof Error ? err.message : fallback
  phase.value = 'error'
}

async function submitInitiatorAnswer(
  peer: ReturnType<typeof usePeerConnection>,
  phase: Ref<DeviceSyncPairingPhase>,
  value: string
): Promise<void> {
  await peer.acceptAnswer(value)
  phase.value = 'connecting'
}

async function submitResponderOffer(
  peer: ReturnType<typeof usePeerConnection>,
  phase: Ref<DeviceSyncPairingPhase>,
  code: Ref<string | null>,
  value: string
): Promise<void> {
  code.value = await peer.createAnswer(value)
  phase.value = 'sharing-answer'
}

const CONNECTION_FAILURE_STATES = new Set<RTCPeerConnectionState>([
  'failed',
  'disconnected',
  'closed'
])

/**
 * A real `RTCPeerConnection` can take 15-30+ seconds of silent ICE checking
 * before it reports `failed` on its own, which reads as a hang rather than
 * a failure — this bounds that wait with an explicit, clearer error.
 */
const CONNECTION_TIMEOUT_MS = 20_000

const CONNECTION_TIMEOUT_MESSAGE =
  'Connection timed out. Check that both devices are on the same Wi-Fi network, then try again.'

/**
 * Mirrors the underlying RTCPeerConnection state into phase/error. Once
 * genuinely paired, the connection closing later (end of sync session,
 * navigation away) is expected teardown, not a failure.
 *
 * `phase` only reaches `'connected'` once BOTH `connectionState` is
 * `'connected'` AND `peer.dataChannel` is populated — `usePeerConnection`
 * only publishes the channel once its own `readyState` is `'open'` (see its
 * `setDataChannel`), so this is a true "ready to send" signal, not just
 * "ICE/DTLS is up" (which can precede the channel's own SCTP handshake
 * finishing, however briefly — long enough to have caused
 * `SharedDeviceSyncPairing` to hand `useDeviceSyncSession` a channel that
 * then rejected every `send()`).
 *
 * Also starts a fallback timeout the first time `connectionState` reports
 * `connecting` — the point both sides have set both descriptions and ICE
 * checks have actually begun, so this never fires while a device is still
 * waiting on the human QR-scan/paste step. Left running until genuinely
 * connected (not just until `connectionState` says so), it doubles as a
 * safety net for a data channel that never opens even though ICE/DTLS did.
 * Returns a cleanup function that clears any pending timeout, for callers
 * to invoke on `close()`.
 */
function watchConnectionState(
  peer: ReturnType<typeof usePeerConnection>,
  phase: Ref<DeviceSyncPairingPhase>,
  error: Ref<string | null>
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function clearConnectionTimeout(): void {
    if (timeoutId === null) return
    clearTimeout(timeoutId)
    timeoutId = null
  }

  watch([peer.connectionState, peer.dataChannel], ([state, channel]) => {
    if (state === 'connected' && channel) {
      clearConnectionTimeout()
      phase.value = 'connected'
      return
    }
    if (phase.value === 'connected') return
    if (CONNECTION_FAILURE_STATES.has(state)) {
      clearConnectionTimeout()
      applyError(phase, error, null, 'Connection failed')
      return
    }
    if (state === 'connecting' && timeoutId === null) {
      timeoutId = setTimeout(() => {
        timeoutId = null
        if (phase.value === 'connected' || phase.value === 'error') return
        applyError(phase, error, null, CONNECTION_TIMEOUT_MESSAGE)
      }, CONNECTION_TIMEOUT_MS)
    }
  })

  return clearConnectionTimeout
}

export type DeviceSyncPairingPhase =
  | 'idle'
  | 'awaiting-offer'
  | 'sharing-offer'
  | 'sharing-answer'
  | 'connecting'
  | 'connected'
  | 'error'

export interface UseDeviceSyncPairing {
  /** Current step of the pairing flow */
  phase: DeepReadonly<Ref<DeviceSyncPairingPhase>>
  /** The code this device should currently display, if any (offer for the initiator, answer for the responder) */
  code: DeepReadonly<Ref<string | null>>
  /** Message from the last failure, if any */
  error: DeepReadonly<Ref<string | null>>
  /** The resulting data channel once paired — for the sync session (PR3) to send/receive over */
  dataChannel: DeepReadonly<ShallowRef<RTCDataChannel | null>>
  /** Initiator only: creates the offer and populates `code`. No-op for a responder. */
  start: () => Promise<void>
  /** Feeds a scanned or pasted code into the flow: an offer for a responder, an answer for an initiator */
  submitCode: (value: string) => Promise<void>
  /**
   * Closes the underlying connection, gracefully (see
   * `usePeerConnection`'s `close`) — awaiting this before considering a sync
   * attempt finished lets any already-sent data actually reach the peer.
   * Safe to call multiple times.
   */
  close: () => Promise<void>
}

export function useDeviceSyncPairing(
  role: DeviceSyncRole
): UseDeviceSyncPairing {
  const peer = usePeerConnection()
  const phase = ref<DeviceSyncPairingPhase>(
    role === 'initiator' ? 'idle' : 'awaiting-offer'
  )
  const code = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function start(): Promise<void> {
    if (role !== 'initiator') return
    try {
      code.value = await peer.createOffer()
      phase.value = 'sharing-offer'
    } catch (err) {
      applyError(phase, error, err, 'Failed to create pairing offer')
    }
  }

  async function submitCode(value: string): Promise<void> {
    try {
      if (role === 'initiator') {
        await submitInitiatorAnswer(peer, phase, value)
      } else {
        await submitResponderOffer(peer, phase, code, value)
      }
    } catch (err) {
      applyError(phase, error, err, 'Failed to complete pairing')
    }
  }

  const clearConnectionTimeout = watchConnectionState(peer, phase, error)

  async function close(): Promise<void> {
    clearConnectionTimeout()
    await peer.close()
  }

  return {
    close,
    code: readonly(code),
    dataChannel: peer.dataChannel,
    error: readonly(error),
    phase: readonly(phase),
    start,
    submitCode
  }
}
