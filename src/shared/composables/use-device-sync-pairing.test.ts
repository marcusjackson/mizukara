import { markRaw, nextTick, readonly, ref, shallowRef } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDeviceSyncPairing } from './use-device-sync-pairing'

const mockPeer = {
  acceptAnswer: vi.fn(),
  close: vi.fn(),
  connectionState: ref<RTCPeerConnectionState>('new'),
  createAnswer: vi.fn(),
  createOffer: vi.fn(),
  dataChannel: shallowRef<RTCDataChannel | null>(null)
}

vi.mock('@/shared/composables/use-peer-connection', () => ({
  usePeerConnection: () => ({
    acceptAnswer: mockPeer.acceptAnswer,
    close: mockPeer.close,
    connectionState: readonly(mockPeer.connectionState),
    createAnswer: mockPeer.createAnswer,
    createOffer: mockPeer.createOffer,
    dataChannel: readonly(mockPeer.dataChannel)
  })
}))

describe('useDeviceSyncPairing', () => {
  beforeEach(() => {
    mockPeer.connectionState.value = 'new'
    mockPeer.dataChannel.value = null
  })

  describe('initiator', () => {
    it('starts idle with no code', () => {
      const pairing = useDeviceSyncPairing('initiator')

      expect(pairing.phase.value).toBe('idle')
      expect(pairing.code.value).toBeNull()
    })

    it('creates an offer and shares it', async () => {
      mockPeer.createOffer.mockResolvedValueOnce('offer-code')
      const pairing = useDeviceSyncPairing('initiator')

      await pairing.start()

      expect(pairing.code.value).toBe('offer-code')
      expect(pairing.phase.value).toBe('sharing-offer')
    })

    it('moves to error when creating the offer fails', async () => {
      mockPeer.createOffer.mockRejectedValueOnce(new Error('no camera'))
      const pairing = useDeviceSyncPairing('initiator')

      await pairing.start()

      expect(pairing.phase.value).toBe('error')
      expect(pairing.error.value).toBe('no camera')
    })

    it('accepts the answer code and moves to connecting', async () => {
      const pairing = useDeviceSyncPairing('initiator')

      await pairing.submitCode('answer-code')

      expect(mockPeer.acceptAnswer).toHaveBeenCalledWith('answer-code')
      expect(pairing.phase.value).toBe('connecting')
    })

    it('moves to connected once the underlying connection connects and the data channel is open', async () => {
      const pairing = useDeviceSyncPairing('initiator')
      await pairing.submitCode('answer-code')

      mockPeer.connectionState.value = 'connected'
      mockPeer.dataChannel.value = markRaw({} as RTCDataChannel)
      await nextTick()

      expect(pairing.phase.value).toBe('connected')
    })

    it('does not move to connected while connectionState is connected but the data channel has not opened yet', async () => {
      // usePeerConnection only publishes `dataChannel` once its readyState
      // is 'open' — connectionState reaching 'connected' (ICE/DTLS up) can
      // briefly precede that, and phase must not report readiness before
      // both are true, or callers hand a not-yet-open channel to send().
      const pairing = useDeviceSyncPairing('initiator')
      await pairing.submitCode('answer-code')

      mockPeer.connectionState.value = 'connected'
      await nextTick()

      expect(pairing.phase.value).not.toBe('connected')
    })

    it('moves to error when the underlying connection fails', async () => {
      const pairing = useDeviceSyncPairing('initiator')

      mockPeer.connectionState.value = 'failed'
      await nextTick()

      expect(pairing.phase.value).toBe('error')
      expect(pairing.error.value).toBe('Connection failed')
    })

    it('moves to error when the underlying connection disconnects before pairing completes', async () => {
      const pairing = useDeviceSyncPairing('initiator')

      mockPeer.connectionState.value = 'disconnected'
      await nextTick()

      expect(pairing.phase.value).toBe('error')
    })

    it('moves to error when the underlying connection closes before pairing completes', async () => {
      const pairing = useDeviceSyncPairing('initiator')

      mockPeer.connectionState.value = 'closed'
      await nextTick()

      expect(pairing.phase.value).toBe('error')
    })

    it('does not move to error when the connection closes after pairing already succeeded', async () => {
      const pairing = useDeviceSyncPairing('initiator')
      mockPeer.connectionState.value = 'connected'
      mockPeer.dataChannel.value = markRaw({} as RTCDataChannel)
      await nextTick()

      mockPeer.connectionState.value = 'closed'
      await nextTick()

      expect(pairing.phase.value).toBe('connected')
    })

    it('moves to error with a timeout message if connecting never resolves', async () => {
      vi.useFakeTimers()
      try {
        const pairing = useDeviceSyncPairing('initiator')

        mockPeer.connectionState.value = 'connecting'
        await nextTick()
        expect(pairing.phase.value).not.toBe('error')

        await vi.advanceTimersByTimeAsync(20_000)

        expect(pairing.phase.value).toBe('error')
        expect(pairing.error.value).toMatch(/timed out/i)
      } finally {
        vi.useRealTimers()
      }
    })

    it('does not time out once the connection succeeds first', async () => {
      vi.useFakeTimers()
      try {
        const pairing = useDeviceSyncPairing('initiator')

        mockPeer.connectionState.value = 'connecting'
        await nextTick()
        mockPeer.connectionState.value = 'connected'
        mockPeer.dataChannel.value = markRaw({} as RTCDataChannel)
        await nextTick()

        await vi.advanceTimersByTimeAsync(20_000)

        expect(pairing.phase.value).toBe('connected')
      } finally {
        vi.useRealTimers()
      }
    })

    it('times out if connectionState reaches connected but the data channel never opens', async () => {
      vi.useFakeTimers()
      try {
        const pairing = useDeviceSyncPairing('initiator')

        mockPeer.connectionState.value = 'connecting'
        await nextTick()
        mockPeer.connectionState.value = 'connected'
        await nextTick()

        await vi.advanceTimersByTimeAsync(20_000)

        expect(pairing.phase.value).toBe('error')
        expect(pairing.error.value).toMatch(/timed out/i)
      } finally {
        vi.useRealTimers()
      }
    })

    it('does not start the timeout clock while still waiting on a human QR scan/paste', async () => {
      vi.useFakeTimers()
      try {
        const pairing = useDeviceSyncPairing('initiator')

        // connectionState stays 'new' the whole time a device is just
        // displaying/scanning codes — no 'connecting' transition yet.
        await vi.advanceTimersByTimeAsync(20_000)

        expect(pairing.phase.value).not.toBe('error')
      } finally {
        vi.useRealTimers()
      }
    })

    it('clears the pending timeout on close so it cannot fire after teardown', async () => {
      vi.useFakeTimers()
      try {
        const pairing = useDeviceSyncPairing('initiator')

        mockPeer.connectionState.value = 'connecting'
        await nextTick()
        await pairing.close()

        await vi.advanceTimersByTimeAsync(20_000)

        expect(pairing.phase.value).not.toBe('error')
      } finally {
        vi.useRealTimers()
      }
    })

    it('moves to error when accepting the answer fails', async () => {
      mockPeer.acceptAnswer.mockRejectedValueOnce(new Error('bad code'))
      const pairing = useDeviceSyncPairing('initiator')

      await pairing.submitCode('garbage')

      expect(pairing.phase.value).toBe('error')
      expect(pairing.error.value).toBe('bad code')
    })
  })

  describe('responder', () => {
    it('starts awaiting an offer with no code', () => {
      const pairing = useDeviceSyncPairing('responder')

      expect(pairing.phase.value).toBe('awaiting-offer')
      expect(pairing.code.value).toBeNull()
    })

    it('does nothing when start() is called', async () => {
      const pairing = useDeviceSyncPairing('responder')

      await pairing.start()

      expect(mockPeer.createOffer).not.toHaveBeenCalled()
      expect(pairing.phase.value).toBe('awaiting-offer')
    })

    it('consumes the offer code and shares the resulting answer', async () => {
      mockPeer.createAnswer.mockResolvedValueOnce('answer-code')
      const pairing = useDeviceSyncPairing('responder')

      await pairing.submitCode('offer-code')

      expect(mockPeer.createAnswer).toHaveBeenCalledWith('offer-code')
      expect(pairing.code.value).toBe('answer-code')
      expect(pairing.phase.value).toBe('sharing-answer')
    })

    it('moves to error when the offer code is invalid', async () => {
      mockPeer.createAnswer.mockRejectedValueOnce(new Error('bad offer'))
      const pairing = useDeviceSyncPairing('responder')

      await pairing.submitCode('garbage')

      expect(pairing.phase.value).toBe('error')
      expect(pairing.error.value).toBe('bad offer')
    })
  })

  it('exposes the underlying data channel', () => {
    // markRaw so Vue's readonly() wrapper doesn't proxy this plain object —
    // the same guarantee usePeerConnection's own markRaw on real
    // RTCDataChannel instances gives, needed here for `toBe` to hold.
    mockPeer.dataChannel.value = markRaw({} as RTCDataChannel)
    const pairing = useDeviceSyncPairing('initiator')

    expect(pairing.dataChannel.value).toBe(mockPeer.dataChannel.value)
  })

  it('delegates close() to the underlying peer connection', async () => {
    const pairing = useDeviceSyncPairing('initiator')

    await pairing.close()

    expect(mockPeer.close).toHaveBeenCalled()
  })
})
