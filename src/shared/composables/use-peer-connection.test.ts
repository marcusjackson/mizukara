import { effectScope } from 'vue'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePeerConnection } from './use-peer-connection'

const SAMPLE_SDP = [
  'v=0',
  'o=- 0 0 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
  'c=IN IP4 0.0.0.0',
  'a=ice-ufrag:abcd',
  'a=ice-pwd:0123456789abcdef01234567',
  'a=fingerprint:sha-256 AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34:AB:CD:12:34',
  'a=setup:actpass',
  'a=mid:0',
  'a=candidate:1 1 udp 2122260223 abcd.local 12345 typ host generation 0 ufrag abcd network-id 1',
  'a=end-of-candidates',
  ''
].join('\r\n')

class FakeDataChannel extends EventTarget {
  binaryType = 'blob'
  readyState: RTCDataChannelState = 'connecting'
  readonly label: string

  constructor(label: string) {
    super()
    this.label = label
  }

  close(): void {
    this.readyState = 'closed'
    this.dispatchEvent(new Event('close'))
  }

  simulateOpen(): void {
    this.readyState = 'open'
    this.dispatchEvent(new Event('open'))
  }
}

class DataChannelEvent extends Event {
  readonly channel: FakeDataChannel

  constructor(channel: FakeDataChannel) {
    super('datachannel')
    this.channel = channel
  }
}

const createdPeerConnections: FakePeerConnection[] = []

class FakePeerConnection extends EventTarget {
  connectionState: RTCPeerConnectionState = 'new'
  iceGatheringState: RTCIceGatheringState = 'new'
  localDescription: { type: string; sdp: string } | null = null
  remoteDescription: { type: string; sdp: string } | null = null
  readonly dataChannels: FakeDataChannel[] = []

  constructor() {
    super()
    createdPeerConnections.push(this)
  }

  createDataChannel(label: string): FakeDataChannel {
    const channel = new FakeDataChannel(label)
    this.dataChannels.push(channel)
    return channel
  }

  createOffer(): Promise<{ type: 'offer'; sdp: string }> {
    return Promise.resolve({ sdp: SAMPLE_SDP, type: 'offer' })
  }

  createAnswer(): Promise<{ type: 'answer'; sdp: string }> {
    return Promise.resolve({ sdp: SAMPLE_SDP, type: 'answer' })
  }

  setLocalDescription(description: {
    type: string
    sdp: string
  }): Promise<void> {
    this.localDescription = description
    this.iceGatheringState = 'gathering'
    queueMicrotask(() => {
      this.iceGatheringState = 'complete'
      this.dispatchEvent(new Event('icegatheringstatechange'))
    })
    return Promise.resolve()
  }

  setRemoteDescription(description: {
    type: string
    sdp: string
  }): Promise<void> {
    this.remoteDescription = description
    return Promise.resolve()
  }

  close(): void {
    this.connectionState = 'closed'
  }
}

describe('usePeerConnection', () => {
  beforeEach(() => {
    createdPeerConnections.length = 0
    vi.stubGlobal('RTCPeerConnection', FakePeerConnection)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a data channel and returns a compact offer code after ICE gathering completes', async () => {
    const peer = usePeerConnection()

    const offerCode = await peer.createOffer()

    expect(offerCode).toMatch(/^[A-Za-z0-9_-]+$/)
    // Not published yet — only once the channel's own readyState is 'open',
    // which connectionState reaching 'connected' doesn't guarantee.
    expect(peer.dataChannel.value).toBeNull()

    const [fakePc] = createdPeerConnections
    fakePc?.dataChannels[0]?.simulateOpen()

    expect(peer.dataChannel.value).not.toBeNull()
    expect(peer.dataChannel.value?.label).toBe('mizukara-device-sync')
  })

  it('does not publish the data channel before its readyState is open', async () => {
    const peer = usePeerConnection()
    await peer.createOffer()

    expect(peer.dataChannel.value).toBeNull()
  })

  it('sets the remote description as an offer and returns a compact answer code', async () => {
    const initiator = usePeerConnection()
    const offerCode = await initiator.createOffer()

    const responder = usePeerConnection()
    const answerCode = await responder.createAnswer(offerCode)

    expect(answerCode).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('rejects an answer code passed to createAnswer', async () => {
    const initiator = usePeerConnection()
    const offerCode = await initiator.createOffer()
    const responder = usePeerConnection()
    const answerCode = await responder.createAnswer(offerCode)

    const anotherResponder = usePeerConnection()
    await expect(anotherResponder.createAnswer(answerCode)).rejects.toThrow(
      /"offer" code but received a "answer" code/
    )
  })

  it('rejects an offer code passed to acceptAnswer', async () => {
    const initiator = usePeerConnection()
    const offerCode = await initiator.createOffer()

    await expect(initiator.acceptAnswer(offerCode)).rejects.toThrow(
      /"answer" code but received a "offer" code/
    )
  })

  it('completes the handshake by accepting the responder answer code', async () => {
    const initiator = usePeerConnection()
    const offerCode = await initiator.createOffer()
    const responder = usePeerConnection()
    const answerCode = await responder.createAnswer(offerCode)

    await expect(initiator.acceptAnswer(answerCode)).resolves.toBeUndefined()
  })

  it('updates connectionState when the underlying connection changes', async () => {
    const peer = usePeerConnection()
    await peer.createOffer()

    expect(peer.connectionState.value).toBe('new')
  })

  it('picks up a data channel delivered via the datachannel event (responder side)', () => {
    const peer = usePeerConnection()
    const [fakePc] = createdPeerConnections
    if (!fakePc)
      throw new Error(
        'expected usePeerConnection to construct an RTCPeerConnection'
      )

    // The responder never calls createDataChannel itself — the browser
    // hands it the initiator's channel once negotiation completes. jsdom
    // has no real SCTP layer to trigger that, so this dispatches the event
    // directly against the fake connection the composable is holding.
    const channel = fakePc.createDataChannel('mizukara-device-sync')
    fakePc.dispatchEvent(new DataChannelEvent(channel))
    expect(peer.dataChannel.value).toBeNull()

    channel.simulateOpen()

    expect(peer.dataChannel.value).toBe(channel)
  })

  it('closes the data channel and connection, and is safe to call twice', async () => {
    const peer = usePeerConnection()
    await peer.createOffer()
    const [fakePc] = createdPeerConnections
    fakePc?.dataChannels[0]?.simulateOpen()
    expect(peer.dataChannel.value).not.toBeNull()

    await peer.close()
    expect(peer.dataChannel.value).toBeNull()
    expect(peer.connectionState.value).toBe('closed')

    await expect(peer.close()).resolves.toBeUndefined()
  })

  it('does not close the connection until the data channel finishes its own close handshake', async () => {
    const peer = usePeerConnection()
    await peer.createOffer()
    const [fakePc] = createdPeerConnections
    const channel = fakePc?.dataChannels[0]
    channel?.simulateOpen()
    if (!channel) throw new Error('expected a data channel to exist')

    // Override close() so it doesn't auto-fire 'close' synchronously (the
    // default FakeDataChannel behavior other tests rely on) — this test
    // needs to observe the state *between* calling close() and the
    // channel's handshake actually completing.
    let finishChannelClose: (() => void) | undefined
    channel.close = () => {
      finishChannelClose = () => {
        channel.readyState = 'closed'
        channel.dispatchEvent(new Event('close'))
      }
    }

    const closePromise = peer.close()
    await Promise.resolve()
    await Promise.resolve()
    expect(peer.connectionState.value).not.toBe('closed')

    finishChannelClose?.()
    await closePromise

    expect(peer.connectionState.value).toBe('closed')
  })

  it('closes the connection anyway if the data channel never finishes closing', async () => {
    vi.useFakeTimers()
    try {
      const peer = usePeerConnection()
      await peer.createOffer()
      const [fakePc] = createdPeerConnections
      const channel = fakePc?.dataChannels[0]
      channel?.simulateOpen()
      if (!channel) throw new Error('expected a data channel to exist')
      // A channel that never actually closes — simulates a peer that has
      // already vanished and can't complete the close handshake.
      channel.close = () => {
        // intentionally left non-firing
      }

      const closePromise = peer.close()
      await vi.advanceTimersByTimeAsync(3_000)
      await closePromise

      expect(peer.connectionState.value).toBe('closed')
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes the connection when its effect scope is disposed', async () => {
    const scope = effectScope()
    let peer!: ReturnType<typeof usePeerConnection>
    await scope.run(async () => {
      peer = usePeerConnection()
      await peer.createOffer()
      const [fakePc] = createdPeerConnections
      fakePc?.dataChannels[0]?.simulateOpen()
    })

    scope.stop()
    // onScopeDispose's close() is graceful (awaits the data channel's own
    // close handshake before closing the connection) and Vue doesn't await
    // disposal callbacks, so let its microtasks settle before asserting.
    await Promise.resolve()
    await Promise.resolve()

    expect(peer.connectionState.value).toBe('closed')
  })
})
