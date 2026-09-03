/**
 * Wire format for `use-chunked-transport.ts`: splitting an arbitrary byte
 * payload into `RTCDataChannel`-sized chunks and reassembling them on the
 * other side, plus the backpressure wait that keeps a large send from
 * flooding the channel's send buffer. Pure/structural — agnostic of what
 * the bytes represent, so the merge engine's serialized rows ride on this
 * without this module knowing anything about tables or rows.
 */

/** One flag byte per chunk: 1 = last chunk of the message, 0 = more follow */
const CHUNK_HEADER_BYTES = 1

/**
 * 16 KiB is the conservative, cross-browser-safe `RTCDataChannel` message
 * size — some browsers accept larger messages, but this app targets the
 * lowest common denominator rather than negotiating `max-message-size` per
 * peer.
 */
export const CHUNK_PAYLOAD_BYTES = 16 * 1024 - CHUNK_HEADER_BYTES

/** Backpressure kicks in once the send buffer holds this much unsent data */
export const BUFFERED_AMOUNT_HIGH_THRESHOLD = 1024 * 1024

function buildChunk(
  payload: Uint8Array<ArrayBuffer>,
  isLast: boolean
): Uint8Array<ArrayBuffer> {
  const chunk = new Uint8Array(payload.length + CHUNK_HEADER_BYTES)
  chunk[0] = isLast ? 1 : 0
  chunk.set(payload, CHUNK_HEADER_BYTES)
  return chunk
}

/** Splits a message into wire-ready chunks. An empty message still yields one (empty-payload, final) chunk, so the receiver has something to reassemble. */
export function splitIntoChunks(
  data: Uint8Array<ArrayBuffer>
): Uint8Array<ArrayBuffer>[] {
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let offset = 0
  do {
    const slice = data.subarray(offset, offset + CHUNK_PAYLOAD_BYTES)
    offset += CHUNK_PAYLOAD_BYTES
    chunks.push(buildChunk(slice, offset >= data.length))
  } while (offset < data.length)
  return chunks
}

export interface DecodedChunk {
  isLast: boolean
  payload: Uint8Array<ArrayBuffer>
}

export function decodeChunk(chunk: Uint8Array<ArrayBuffer>): DecodedChunk {
  const flag = chunk.at(0)
  if (flag === undefined) {
    throw new Error('Received an empty chunk with no header byte')
  }
  return { isLast: flag === 1, payload: chunk.subarray(CHUNK_HEADER_BYTES) }
}

/** Concatenates a reassembled message's payload chunks, in receipt order */
export function concatChunks(
  payloads: Uint8Array<ArrayBuffer>[]
): Uint8Array<ArrayBuffer> {
  const totalLength = payloads.reduce((sum, payload) => sum + payload.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const payload of payloads) {
    result.set(payload, offset)
    offset += payload.length
  }
  return result
}

type BackpressureEventType = 'bufferedamountlow' | 'close'

export interface BackpressuredChannel {
  readonly bufferedAmount: number
  bufferedAmountLowThreshold: number
  addEventListener(type: BackpressureEventType, listener: () => void): void
  removeEventListener(type: BackpressureEventType, listener: () => void): void
}

/**
 * Resolves once the channel's send buffer has drained below the
 * high-water mark, so a large message can't pile every chunk into the
 * buffer faster than the network drains it. Rejects instead of hanging
 * forever if the channel closes while still over the mark.
 */
export function waitForBufferedAmountLow(
  channel: BackpressuredChannel
): Promise<void> {
  if (channel.bufferedAmount <= BUFFERED_AMOUNT_HIGH_THRESHOLD) {
    return Promise.resolve()
  }

  channel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_HIGH_THRESHOLD
  return new Promise((resolve, reject) => {
    function cleanup(): void {
      channel.removeEventListener('bufferedamountlow', handleLow)
      channel.removeEventListener('close', handleClose)
    }
    function handleLow(): void {
      cleanup()
      resolve()
    }
    function handleClose(): void {
      cleanup()
      reject(new Error('Data channel closed while waiting to send'))
    }
    channel.addEventListener('bufferedamountlow', handleLow)
    channel.addEventListener('close', handleClose)
  })
}
