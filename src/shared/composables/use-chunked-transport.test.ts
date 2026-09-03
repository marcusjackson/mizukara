import { nextTick, shallowRef } from 'vue'

import { describe, expect, it, vi } from 'vitest'

import { CHUNK_PAYLOAD_BYTES } from '@/shared/utils/chunked-transport-protocol'

import { useChunkedTransport } from './use-chunked-transport'

class FakeDataChannel extends EventTarget {
  readyState: RTCDataChannelState = 'open'
  bufferedAmount = 0
  bufferedAmountLowThreshold = 0
  readonly sent: Uint8Array[] = []

  send(data: Uint8Array): void {
    this.sent.push(data)
  }

  receive(chunk: Uint8Array): void {
    this.dispatchEvent(
      new MessageEvent('message', { data: chunk.buffer as ArrayBuffer })
    )
  }
}

describe('useChunkedTransport', () => {
  it('throws when the channel is not open', async () => {
    const channel = shallowRef<RTCDataChannel | null>(null)
    const transport = useChunkedTransport(channel)

    await expect(transport.send(new Uint8Array([1, 2, 3]))).rejects.toThrow(
      /not open/
    )
  })

  it('sends a small message as a single chunk', async () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)

    await transport.send(new TextEncoder().encode('hi'))

    expect(fake.sent).toHaveLength(1)
    expect(fake.sent[0]?.at(0)).toBe(1) // final-chunk flag
  })

  it('sends a large message as multiple chunks', async () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)

    await transport.send(new Uint8Array(CHUNK_PAYLOAD_BYTES + 1))

    expect(fake.sent).toHaveLength(2)
    expect(fake.sent[0]?.at(0)).toBe(0)
    expect(fake.sent[1]?.at(0)).toBe(1)
  })

  it('reassembles chunks received across multiple messages', () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)
    const handler = vi.fn()
    transport.onMessage(handler)

    const original = new TextEncoder().encode('a longer sync payload')
    const [first, second] = [original.subarray(0, 5), original.subarray(5)]
    fake.receive(Uint8Array.from([0, ...first]))
    fake.receive(Uint8Array.from([1, ...second]))

    expect(handler).toHaveBeenCalledTimes(1)
    const [received] = handler.mock.calls[0] as [Uint8Array]
    expect(new TextDecoder().decode(received)).toBe('a longer sync payload')
  })

  it('does not invoke the handler until the final chunk arrives', () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)
    const handler = vi.fn()
    transport.onMessage(handler)

    fake.receive(Uint8Array.from([0, 1, 2, 3]))

    expect(handler).not.toHaveBeenCalled()
  })

  it('stops notifying a handler after it unsubscribes', () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)
    const handler = vi.fn()
    const unsubscribe = transport.onMessage(handler)

    unsubscribe()
    fake.receive(Uint8Array.from([1, 9, 9]))

    expect(handler).not.toHaveBeenCalled()
  })

  it('reports a non-ArrayBuffer message via onError instead of throwing, and stays usable', () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)
    const messageHandler = vi.fn()
    const errorHandler = vi.fn<(error: Error) => void>()
    transport.onMessage(messageHandler)
    transport.onError(errorHandler)

    fake.dispatchEvent(new MessageEvent('message', { data: 'not binary' }))
    expect(messageHandler).not.toHaveBeenCalled()
    expect(errorHandler).toHaveBeenCalledTimes(1)
    expect(errorHandler.mock.calls[0]?.[0].message).toContain('binaryType')

    fake.receive(Uint8Array.from([1, 42]))
    expect(messageHandler).toHaveBeenCalledTimes(1)
    expect(messageHandler).toHaveBeenCalledWith(Uint8Array.from([42]))
  })

  it('reports a malformed (empty) chunk via onError instead of throwing', () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)
    const errorHandler = vi.fn<(error: Error) => void>()
    transport.onError(errorHandler)

    fake.dispatchEvent(
      new MessageEvent('message', { data: new ArrayBuffer(0) })
    )

    expect(errorHandler).toHaveBeenCalledTimes(1)
    expect(errorHandler.mock.calls[0]?.[0].message).toContain('empty chunk')
  })

  it('stops notifying an error handler after it unsubscribes', () => {
    const fake = new FakeDataChannel()
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)
    const errorHandler = vi.fn<(error: Error) => void>()
    const unsubscribe = transport.onError(errorHandler)

    unsubscribe()
    fake.dispatchEvent(new MessageEvent('message', { data: 'not binary' }))

    expect(errorHandler).not.toHaveBeenCalled()
  })

  it('re-subscribes when the underlying channel ref changes', async () => {
    const first = new FakeDataChannel()
    const channel = shallowRef(first as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)
    const handler = vi.fn()
    transport.onMessage(handler)

    const second = new FakeDataChannel()
    channel.value = second as unknown as RTCDataChannel
    // The ref watcher flushes on the next tick, not synchronously on assignment.
    await nextTick()

    first.receive(Uint8Array.from([1, 1]))
    expect(handler).not.toHaveBeenCalled()

    second.receive(Uint8Array.from([1, 2]))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('waits for bufferedamountlow before sending the next chunk over a full buffer', async () => {
    const fake = new FakeDataChannel()
    fake.bufferedAmount = 2 * 1024 * 1024
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)

    const pending = transport.send(new Uint8Array(CHUNK_PAYLOAD_BYTES + 1))
    await Promise.resolve()
    await Promise.resolve()

    expect(fake.sent).toHaveLength(0)

    fake.bufferedAmount = 0
    fake.dispatchEvent(new Event('bufferedamountlow'))
    await pending

    expect(fake.sent).toHaveLength(2)
  })

  it('rejects an in-flight send if the channel closes while backpressured', async () => {
    const fake = new FakeDataChannel()
    fake.bufferedAmount = 2 * 1024 * 1024
    const channel = shallowRef(fake as unknown as RTCDataChannel)
    const transport = useChunkedTransport(channel)

    const pending = transport.send(new Uint8Array(CHUNK_PAYLOAD_BYTES + 1))
    await Promise.resolve()
    await Promise.resolve()

    fake.dispatchEvent(new Event('close'))

    await expect(pending).rejects.toThrow(/closed while waiting to send/)
  })
})
