import { describe, expect, it, vi } from 'vitest'

import {
  BUFFERED_AMOUNT_HIGH_THRESHOLD,
  CHUNK_PAYLOAD_BYTES,
  concatChunks,
  decodeChunk,
  splitIntoChunks,
  waitForBufferedAmountLow
} from './chunked-transport-protocol'

import type { BackpressuredChannel } from './chunked-transport-protocol'

function reassemble(
  chunks: Uint8Array<ArrayBuffer>[]
): Uint8Array<ArrayBuffer> {
  const decoded = chunks.map(decodeChunk)
  return concatChunks(decoded.map((c) => c.payload))
}

describe('splitIntoChunks / decodeChunk / concatChunks', () => {
  it('round-trips a small message as a single final chunk', () => {
    const data = new TextEncoder().encode('hello device sync')

    const chunks = splitIntoChunks(data)

    expect(chunks).toHaveLength(1)
    expect(decodeChunk(chunks[0]!).isLast).toBe(true)
    expect(new TextDecoder().decode(reassemble(chunks))).toBe(
      'hello device sync'
    )
  })

  it('marks every chunk but the last as not-final', () => {
    const data = new Uint8Array(CHUNK_PAYLOAD_BYTES * 3 + 10)

    const chunks = splitIntoChunks(data)

    expect(chunks).toHaveLength(4)
    chunks.forEach((chunk, index) => {
      expect(decodeChunk(chunk).isLast).toBe(index === chunks.length - 1)
    })
  })

  it('round-trips a message that is an exact multiple of the chunk size', () => {
    const data = Uint8Array.from(
      { length: CHUNK_PAYLOAD_BYTES * 2 },
      (_, i) => i % 256
    )

    const chunks = splitIntoChunks(data)

    expect(chunks).toHaveLength(2)
    expect(reassemble(chunks)).toEqual(data)
  })

  it('round-trips an empty message as one empty final chunk', () => {
    const chunks = splitIntoChunks(new Uint8Array(0))

    expect(chunks).toHaveLength(1)
    expect(decodeChunk(chunks[0]!)).toEqual({
      isLast: true,
      payload: new Uint8Array(0)
    })
  })

  it('throws when decoding a chunk with no header byte', () => {
    expect(() => decodeChunk(new Uint8Array(0))).toThrow(/empty chunk/i)
  })
})

type FakeChannelEventType = 'bufferedamountlow' | 'close'

function createFakeChannel(bufferedAmount: number): BackpressuredChannel & {
  handlers: Record<string, () => void>
} {
  const handlers: Record<string, () => void> = {}
  return {
    addEventListener: vi.fn(
      (type: FakeChannelEventType, listener: () => void) => {
        handlers[type] = listener
      }
    ),
    bufferedAmount,
    bufferedAmountLowThreshold: 0,
    handlers,
    removeEventListener: vi.fn()
  }
}

describe('waitForBufferedAmountLow', () => {
  it('resolves immediately when the buffer is already under the threshold', async () => {
    const channel = createFakeChannel(0)

    await waitForBufferedAmountLow(channel)

    expect(channel.addEventListener).not.toHaveBeenCalled()
  })

  it('waits for the bufferedamountlow event when over the threshold', async () => {
    const channel = createFakeChannel(BUFFERED_AMOUNT_HIGH_THRESHOLD + 1)

    const pending = waitForBufferedAmountLow(channel)
    expect(channel.bufferedAmountLowThreshold).toBe(
      BUFFERED_AMOUNT_HIGH_THRESHOLD
    )

    channel.handlers['bufferedamountlow']!()
    await pending

    expect(channel.removeEventListener).toHaveBeenCalledWith(
      'bufferedamountlow',
      channel.handlers['bufferedamountlow']
    )
  })

  it('rejects if the channel closes while still over the threshold', async () => {
    const channel = createFakeChannel(BUFFERED_AMOUNT_HIGH_THRESHOLD + 1)

    const pending = waitForBufferedAmountLow(channel)
    channel.handlers['close']!()

    await expect(pending).rejects.toThrow(/closed while waiting to send/)
  })
})
