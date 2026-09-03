/**
 * useDeviceSyncSession
 *
 * Wires a paired `RTCDataChannel` (from `useDeviceSyncPairing`) to the merge
 * engine (`@/api/device-sync`): sends this device's full serialized state,
 * waits for the peer's, applies the peer's payload against the local
 * database, then forces a durable save before reporting the session
 * complete — see docs/units/device-sync/atlas.md.
 *
 * A connection dropped mid-transfer (the channel firing `close` before the
 * peer's payload finishes arriving) is treated the same as any other
 * failure: nothing gets applied, so the local database is left exactly as
 * it was and re-running sync converges. `useChunkedTransport`'s `send()`
 * already rejects on a mid-send drop; the `close` listener here covers the
 * receive side, which has nothing to reject otherwise.
 *
 * @example
 * ```ts
 * const session = useDeviceSyncSession()
 * // ...after SharedDeviceSyncPairing emits `paired` with a dataChannel...
 * await session.run(dataChannel)
 * if (session.phase.value === 'complete') { ... }
 * ```
 */

import { readonly, ref, shallowRef } from 'vue'

import {
  applySyncPayload,
  parseSyncPayloadJSON,
  serializeDatabaseToJSON
} from '@/api/device-sync'

import { useChunkedTransport } from '@/shared/composables/use-chunked-transport'
import { useDatabase } from '@/shared/composables/use-database'

import { persistImmediately } from '@/db/indexeddb'

import type { UseChunkedTransport } from '@/shared/composables/use-chunked-transport'
import type { SyncPayload } from '@/shared/types/device-sync-payload-types'
import type { DeepReadonly, Ref } from 'vue'

export type DeviceSyncSessionPhase = 'idle' | 'syncing' | 'complete' | 'error'

export interface UseDeviceSyncSession {
  /** Current step of the sync session */
  phase: DeepReadonly<Ref<DeviceSyncSessionPhase>>
  /** Message from the last failure, if any */
  error: DeepReadonly<Ref<string | null>>
  /** Runs one full sync exchange over an already-paired data channel */
  run: (dataChannel: RTCDataChannel) => Promise<void>
}

/**
 * Resolves with the peer's payload once a full message is reassembled, or
 * rejects if the transport reports malformed data or the channel closes
 * before that happens. Always cleans up every listener it registered,
 * whichever way it settles, so a normal post-sync teardown of the channel
 * never fires a stray rejection against an already-settled call.
 */
function waitForPeerPayload(
  transport: UseChunkedTransport,
  channel: RTCDataChannel
): Promise<SyncPayload> {
  return new Promise((resolve, reject) => {
    let settled = false

    function cleanup(): void {
      unsubscribeMessage()
      unsubscribeError()
      channel.removeEventListener('close', handleClose)
    }
    function settleResolve(payload: SyncPayload): void {
      if (settled) return
      settled = true
      cleanup()
      resolve(payload)
    }
    function settleReject(reason: unknown): void {
      if (settled) return
      settled = true
      cleanup()
      reject(reason instanceof Error ? reason : new Error(String(reason)))
    }
    function handleClose(): void {
      settleReject(new Error('Connection closed before sync finished'))
    }

    const unsubscribeMessage = transport.onMessage((bytes) => {
      try {
        settleResolve(parseSyncPayloadJSON(new TextDecoder().decode(bytes)))
      } catch (err) {
        settleReject(err)
      }
    })
    const unsubscribeError = transport.onError(settleReject)
    channel.addEventListener('close', handleClose)
  })
}

export function useDeviceSyncSession(): UseDeviceSyncSession {
  const { database } = useDatabase()
  const phase = ref<DeviceSyncSessionPhase>('idle')
  const error = ref<string | null>(null)

  async function run(dataChannel: RTCDataChannel): Promise<void> {
    phase.value = 'syncing'
    error.value = null

    try {
      const db = database.value
      if (!db) throw new Error('Database not initialized')

      const transport = useChunkedTransport(
        readonly(shallowRef<RTCDataChannel | null>(dataChannel))
      )
      const localPayload = serializeDatabaseToJSON(db)
      const [peerPayload] = await Promise.all([
        waitForPeerPayload(transport, dataChannel),
        transport.send(new TextEncoder().encode(localPayload))
      ])

      applySyncPayload(db, peerPayload)
      await persistImmediately()

      phase.value = 'complete'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sync failed'
      phase.value = 'error'
    }
  }

  return { error: readonly(error), phase: readonly(phase), run }
}
