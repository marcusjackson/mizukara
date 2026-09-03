/**
 * Pure WebRTC signaling helpers used by `use-peer-connection.ts`.
 *
 * Kept independent of the composable so they can be unit-tested with a
 * minimal fake connection — jsdom has no `RTCPeerConnection` implementation
 * at all, so these accept the narrow structural interface they actually
 * use rather than the full DOM type, letting tests pass a plain object
 * instead of standing up a real (nonexistent) browser API.
 */

const STUN_SERVER_URL = 'stun:stun.l.google.com:19302'

/**
 * One public STUN server for connectivity discovery only — never carries
 * sync data. No TURN server: see docs/units/device-sync/atlas.md for why a
 * relay is out of scope.
 */
export function buildIceServers(): RTCIceServer[] {
  return [{ urls: STUN_SERVER_URL }]
}

type GatheringEventType =
  'icegatheringstatechange' | 'connectionstatechange' | 'icecandidate'

export interface GatheringConnection {
  readonly iceGatheringState: RTCIceGatheringState
  readonly connectionState: RTCPeerConnectionState
  addEventListener(
    type: GatheringEventType,
    listener: (event: Event) => void
  ): void
  removeEventListener(
    type: GatheringEventType,
    listener: (event: Event) => void
  ): void
}

/**
 * `'icecandidate'`'s real event type (`RTCPeerConnectionIceEvent`) carries a
 * `candidate: RTCIceCandidate | null` — a real candidate while gathering is
 * still finding them, `null` for the final "no more candidates" marker.
 * `GatheringConnection` stays untyped-`Event` above (matching
 * `EventTarget.addEventListener`'s own signature, which every handler here
 * already relies on being assignable to) rather than modeling that as a
 * distinct listener overload, so this narrows defensively at the one call
 * site that needs it instead.
 */
function getCandidateField(event: Event): unknown {
  return 'candidate' in event ? event.candidate : undefined
}

/**
 * Some mobile browsers have been observed to never fire
 * `icegatheringstatechange` through to `'complete'` at all (a documented
 * class of real-world ICE/mDNS-gathering bug) — confirmed in the field: on
 * one
 * Android device, gathering *as the offerer* consistently never reported
 * `'complete'`, even though real candidates (host + STUN server-reflexive)
 * were found within the first second or two every time; the *answerer*
 * side's gathering on the same device reported `'complete'` normally.
 *
 * Since we can't trust the "I'm done" signal, this instead watches the
 * `'icecandidate'` event directly — fired once per candidate as it's found,
 * independently of the (unreliable) gathering-state signal. Two further
 * timers, both reset/started only once a real candidate has actually
 * arrived, decide when to stop waiting for more:
 *
 * - `CANDIDATE_QUIET_PERIOD_MS`: resolve once this long has passed with no
 *   *new* candidate arriving — the common case (one candidate, then
 *   silence) resolves quickly instead of always waiting out a fixed
 *   duration regardless of whether anything is still happening.
 * - `CANDIDATE_COLLECTION_CAP_MS`: resolve regardless once this long has
 *   passed since the *first* candidate, even if new ones are still
 *   trickling in fast enough to keep resetting the quiet period above —
 *   caps the total wait in that case rather than letting it drag on.
 */
const CANDIDATE_QUIET_PERIOD_MS = 1_000
const CANDIDATE_COLLECTION_CAP_MS = 3_000

/**
 * Absolute fallback if even a first candidate never arrives (which testing
 * suggests basically never happens — it's specifically the "complete"
 * signal that goes missing, not candidate discovery itself) — a safety net
 * of last resort so this can never hang indefinitely with no error and no
 * retry option, which is what happened before this existed.
 */
const ICE_GATHERING_TIMEOUT_MS = 10_000

/**
 * Resolves once ICE gathering finishes, or the candidate-driven timing
 * described above decides enough real candidates have been found, or the
 * absolute fallback timeout elapses — whichever comes first. This app's
 * QR/paste exchange has no ongoing signaling channel to trickle candidates
 * over, so the full candidate set has to already be in the SDP before it's
 * compacted and shown. Rejects instead of hanging forever if the connection
 * closes first (e.g. the owning component unmounts mid-gather) — otherwise
 * this promise, and the listeners it holds, would never resolve.
 */
export function waitForIceGatheringComplete(
  pc: GatheringConnection
): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()

  return new Promise((resolve, reject) => {
    let settled = false
    let quietTimeoutId: ReturnType<typeof setTimeout> | null = null
    let collectionCapTimeoutId: ReturnType<typeof setTimeout> | null = null

    function cleanup(): void {
      pc.removeEventListener('icegatheringstatechange', handleGatheringChange)
      pc.removeEventListener('connectionstatechange', handleConnectionChange)
      pc.removeEventListener('icecandidate', handleIceCandidate)
      clearTimeout(absoluteTimeoutId)
      if (quietTimeoutId !== null) clearTimeout(quietTimeoutId)
      if (collectionCapTimeoutId !== null) clearTimeout(collectionCapTimeoutId)
    }
    function settleResolve(): void {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }
    function handleGatheringChange(): void {
      if (pc.iceGatheringState !== 'complete') return
      settleResolve()
    }
    function handleConnectionChange(): void {
      if (pc.connectionState !== 'closed' || settled) return
      settled = true
      cleanup()
      reject(new Error('Connection closed before ICE gathering completed'))
    }
    function handleIceCandidate(event: Event): void {
      if (!getCandidateField(event)) return
      collectionCapTimeoutId ??= setTimeout(
        settleResolve,
        CANDIDATE_COLLECTION_CAP_MS
      )
      if (quietTimeoutId !== null) clearTimeout(quietTimeoutId)
      quietTimeoutId = setTimeout(settleResolve, CANDIDATE_QUIET_PERIOD_MS)
    }
    const absoluteTimeoutId = setTimeout(
      settleResolve,
      ICE_GATHERING_TIMEOUT_MS
    )
    pc.addEventListener('icegatheringstatechange', handleGatheringChange)
    pc.addEventListener('connectionstatechange', handleConnectionChange)
    pc.addEventListener('icecandidate', handleIceCandidate)
  })
}

export interface LocalSdpConnection extends GatheringConnection {
  readonly localDescription: { sdp: string } | null
  setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>
}

/**
 * Sets the local description, waits for ICE gathering to finish, and
 * returns the resulting SDP text with every gathered candidate already
 * embedded.
 */
export async function gatherLocalSdp(
  pc: LocalSdpConnection,
  description: RTCSessionDescriptionInit
): Promise<string> {
  await pc.setLocalDescription(description)
  await waitForIceGatheringComplete(pc)

  const { localDescription } = pc
  if (!localDescription) {
    throw new Error(
      'RTCPeerConnection has no local description after ICE gathering'
    )
  }
  return localDescription.sdp
}
