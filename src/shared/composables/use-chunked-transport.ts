/**
 * useChunkedTransport
 *
 * Sends and receives arbitrary byte payloads over an `RTCDataChannel`,
 * transparently splitting/reassembling them into wire-sized chunks
 * (`utils/chunked-transport-protocol.ts`). Knows nothing about what the
 * bytes mean — `usePeerConnection` supplies the channel, and the merge
 * engine's serialized payload rides on top of this without either layer
 * depending on the other.
 *
 * @example
 * ```ts
 * const peer = usePeerConnection()
 * const transport = useChunkedTransport(peer.dataChannel)
 * transport.onMessage((bytes) => console.log('received', bytes.length))
 * await transport.send(new TextEncoder().encode('hello'))
 * ```
 */

import { onScopeDispose, watch } from 'vue'

import {
  concatChunks,
  decodeChunk,
  splitIntoChunks,
  waitForBufferedAmountLow
} from '@/shared/utils/chunked-transport-protocol'

import type { DeepReadonly, ShallowRef } from 'vue'

type MessageHandler = (data: Uint8Array<ArrayBuffer>) => void
type ErrorHandler = (error: Error) => void

export interface UseChunkedTransport {
  /** Sends one logical message, chunked and backpressure-aware. Rejects if the channel isn't open. */
  send: (data: Uint8Array<ArrayBuffer>) => Promise<void>
  /** Registers a handler for fully-reassembled incoming messages. Returns an unsubscribe function. */
  onMessage: (handler: MessageHandler) => () => void
  /** Registers a handler for malformed-message errors (e.g. a peer sending a non-binary or corrupt chunk). Returns an unsubscribe function. */
  onError: (handler: ErrorHandler) => () => void
}

interface ReassemblyState {
  receivedPayloads: Uint8Array<ArrayBuffer>[]
}

function notifyError(handlers: Set<ErrorHandler>, error: unknown): void {
  const asError =
    error instanceof Error ? error : new Error('Chunked transport error')
  for (const handler of handlers) handler(asError)
}

/** Builds the data channel 'message' listener: decodes one chunk, reassembles once the final chunk of a message arrives, and reports malformed data via errorHandlers instead of throwing inside the listener. */
function createMessageListener(
  state: ReassemblyState,
  messageHandlers: Set<MessageHandler>,
  errorHandlers: Set<ErrorHandler>
): (event: Event) => void {
  return (event: Event) => {
    const { data } = event as MessageEvent<unknown>
    if (!(data instanceof ArrayBuffer)) {
      notifyError(
        errorHandlers,
        new TypeError(
          'Chunked transport requires the data channel binaryType to be "arraybuffer"'
        )
      )
      return
    }

    try {
      const { isLast, payload } = decodeChunk(new Uint8Array(data))
      state.receivedPayloads.push(payload)
      if (!isLast) return
    } catch (err) {
      notifyError(errorHandlers, err)
      return
    }

    const message = concatChunks(state.receivedPayloads)
    state.receivedPayloads = []
    for (const handler of messageHandlers) handler(message)
  }
}

export function useChunkedTransport(
  dataChannel: DeepReadonly<ShallowRef<RTCDataChannel | null>>
): UseChunkedTransport {
  const messageHandlers = new Set<MessageHandler>()
  const errorHandlers = new Set<ErrorHandler>()
  const state: ReassemblyState = { receivedPayloads: [] }
  const handleMessage = createMessageListener(
    state,
    messageHandlers,
    errorHandlers
  )

  watch(
    dataChannel,
    (channel, previousChannel) => {
      previousChannel?.removeEventListener('message', handleMessage)
      channel?.addEventListener('message', handleMessage)
    },
    { immediate: true }
  )

  async function send(data: Uint8Array<ArrayBuffer>): Promise<void> {
    const channel = dataChannel.value
    if (channel?.readyState !== 'open') {
      throw new Error('Cannot send: data channel is not open')
    }

    // Each chunk waits for the previous one to drain before sending the
    // next — sending concurrently would defeat the backpressure this loop
    // exists for, so this is sequential by design, not an oversight.
    for (const chunk of splitIntoChunks(data)) {
      await waitForBufferedAmountLow(channel)
      channel.send(chunk)
    }
  }

  function onMessage(handler: MessageHandler): () => void {
    messageHandlers.add(handler)
    return () => messageHandlers.delete(handler)
  }

  function onError(handler: ErrorHandler): () => void {
    errorHandlers.add(handler)
    return () => errorHandlers.delete(handler)
  }

  onScopeDispose(() => {
    dataChannel.value?.removeEventListener('message', handleMessage)
    messageHandlers.clear()
    errorHandlers.clear()
  })

  return { onError, onMessage, send }
}
