import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildIceServers,
  gatherLocalSdp,
  waitForIceGatheringComplete
} from './rtc-peer-signaling'

class FakeIceCandidateEvent extends Event {
  constructor(readonly candidate: unknown) {
    super('icecandidate')
  }
}

class FakeConnection extends EventTarget {
  iceGatheringState: RTCIceGatheringState = 'new'
  connectionState: RTCPeerConnectionState = 'new'
  localDescription: { sdp: string } | null = null

  setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
    this.localDescription = { sdp: description.sdp ?? '' }
    return Promise.resolve()
  }

  completeGathering(): void {
    this.iceGatheringState = 'complete'
    this.dispatchEvent(new Event('icegatheringstatechange'))
  }

  closeConnection(): void {
    this.connectionState = 'closed'
    this.dispatchEvent(new Event('connectionstatechange'))
  }

  /** Simulates finding one real candidate (or, with `null`, the "no more candidates" marker). */
  emitCandidate(candidate: unknown): void {
    this.dispatchEvent(new FakeIceCandidateEvent(candidate))
  }
}

describe('buildIceServers', () => {
  it('returns a single public STUN server and no TURN server', () => {
    const servers = buildIceServers()

    expect(servers).toHaveLength(1)
    expect(servers[0]?.urls).toMatch(/^stun:/)
  })
})

describe('waitForIceGatheringComplete', () => {
  it('resolves immediately when gathering is already complete', async () => {
    const pc = new FakeConnection()
    pc.iceGatheringState = 'complete'

    await expect(waitForIceGatheringComplete(pc)).resolves.toBeUndefined()
  })

  it('resolves once icegatheringstatechange reports complete', async () => {
    const pc = new FakeConnection()

    const pending = waitForIceGatheringComplete(pc)
    pc.completeGathering()

    await expect(pending).resolves.toBeUndefined()
  })

  it('ignores gathering-state changes that are not yet complete', async () => {
    const pc = new FakeConnection()

    const pending = waitForIceGatheringComplete(pc)
    pc.iceGatheringState = 'gathering'
    pc.dispatchEvent(new Event('icegatheringstatechange'))
    pc.completeGathering()

    await expect(pending).resolves.toBeUndefined()
  })

  it('rejects if the connection closes before gathering completes', async () => {
    const pc = new FakeConnection()

    const pending = waitForIceGatheringComplete(pc)
    pc.closeConnection()

    await expect(pending).rejects.toThrow(
      /closed before ICE gathering completed/
    )
  })

  describe('fallback behavior when icegatheringstatechange never reports complete', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('resolves 1s after a single candidate, with no more arriving', async () => {
      const pc = new FakeConnection()

      const pending = waitForIceGatheringComplete(pc)
      pc.emitCandidate({ candidate: 'host candidate' })
      await vi.advanceTimersByTimeAsync(1_000)

      await expect(pending).resolves.toBeUndefined()
      expect(pc.iceGatheringState).not.toBe('complete')
    })

    it('does not resolve before the first candidate arrives, or from the "no more candidates" marker alone', async () => {
      const pc = new FakeConnection()
      let resolved = false

      void waitForIceGatheringComplete(pc).then(() => {
        resolved = true
      })
      pc.emitCandidate(null)
      await vi.advanceTimersByTimeAsync(9_999)

      expect(resolved).toBe(false)
    })

    it('restarts the 1s quiet period each time a new candidate arrives', async () => {
      const pc = new FakeConnection()
      let resolved = false

      void waitForIceGatheringComplete(pc).then(() => {
        resolved = true
      })
      pc.emitCandidate({ candidate: 'host candidate' })
      await vi.advanceTimersByTimeAsync(900)
      // A second candidate lands just before the first one's quiet period
      // would have expired — should push resolution out further, not let
      // it fire on the original schedule.
      pc.emitCandidate({ candidate: 'srflx candidate' })
      await vi.advanceTimersByTimeAsync(900)

      expect(resolved).toBe(false)

      await vi.advanceTimersByTimeAsync(100)

      expect(resolved).toBe(true)
    })

    it('caps total collection time at 3s even if candidates keep arriving faster than the quiet period', async () => {
      const pc = new FakeConnection()

      const pending = waitForIceGatheringComplete(pc)
      pc.emitCandidate({ candidate: 'candidate 1' })
      // Keep re-triggering the quiet period every 900ms — would otherwise
      // never let it elapse — but the 3s collection cap (from the first
      // candidate) still forces resolution regardless.
      for (let elapsed = 0; elapsed < 3_000; elapsed += 900) {
        await vi.advanceTimersByTimeAsync(900)
        pc.emitCandidate({ candidate: 'another candidate' })
      }
      await vi.advanceTimersByTimeAsync(200)

      await expect(pending).resolves.toBeUndefined()
    })

    it('resolves via the absolute timeout if not even a first candidate ever arrives', async () => {
      const pc = new FakeConnection()

      const pending = waitForIceGatheringComplete(pc)
      await vi.advanceTimersByTimeAsync(10_000)

      await expect(pending).resolves.toBeUndefined()
      expect(pc.iceGatheringState).not.toBe('complete')
    })

    it('does not resolve twice if gathering completes right at the timeout boundary', async () => {
      const pc = new FakeConnection()

      const pending = waitForIceGatheringComplete(pc)
      pc.completeGathering()
      await vi.advanceTimersByTimeAsync(10_000)

      await expect(pending).resolves.toBeUndefined()
    })
  })
})

describe('gatherLocalSdp', () => {
  it('sets the local description and returns its SDP once gathering completes', async () => {
    const pc = new FakeConnection()

    const pending = gatherLocalSdp(pc, { sdp: 'v=0...', type: 'offer' })
    pc.completeGathering()

    await expect(pending).resolves.toBe('v=0...')
  })

  it('throws if there is no local description once gathering completes', async () => {
    const pc = new FakeConnection()
    pc.setLocalDescription = () => Promise.resolve()

    const pending = gatherLocalSdp(pc, { sdp: 'v=0...', type: 'offer' })
    pc.completeGathering()

    await expect(pending).rejects.toThrow(/no local description/)
  })
})
