import { ref } from 'vue'

import { rasterizeQrModules } from '@test/helpers/qr-fixtures'
import { create } from 'qrcode'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useQrCameraScanner } from './use-qr-camera-scanner'

class FakeTrack {
  stop = vi.fn()
}

class FakeMediaStream {
  private readonly tracks = [new FakeTrack()]
  getTracks(): FakeTrack[] {
    return this.tracks
  }
}

/** jsdom doesn't implement `HTMLMediaElement#play()`; stub it so tests don't hit its "not implemented" warning */
function createFakeVideo(): HTMLVideoElement {
  const video = document.createElement('video')
  video.play = vi.fn().mockResolvedValue(undefined)
  return video
}

function stubAnimationFrame(): { runPendingFrame: () => void } {
  let pendingCallback: FrameRequestCallback | null = null
  let nextHandle = 1

  vi.stubGlobal(
    'requestAnimationFrame',
    (callback: FrameRequestCallback): number => {
      pendingCallback = callback
      return nextHandle++
    }
  )
  vi.stubGlobal('cancelAnimationFrame', (): void => {
    pendingCallback = null
  })

  return {
    runPendingFrame: () => {
      const callback = pendingCallback
      pendingCallback = null
      callback?.(0)
    }
  }
}

describe('useQrCameraScanner', () => {
  let getUserMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    getUserMedia = vi.fn().mockResolvedValue(new FakeMediaStream())
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('starts the camera, attaches the stream, and enters the scanning state', async () => {
    const video = createFakeVideo()
    const videoRef = ref<HTMLVideoElement | null>(video)
    stubAnimationFrame()
    const scanner = useQrCameraScanner(videoRef, vi.fn())

    await scanner.start()

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'environment' }
    })
    expect(video.srcObject).not.toBeNull()
    expect(scanner.isScanning.value).toBe(true)
    expect(scanner.error.value).toBeNull()
  })

  it('records an error and stays stopped when camera access is denied', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('Permission denied'))
    const videoRef = ref<HTMLVideoElement | null>(createFakeVideo())
    stubAnimationFrame()
    const scanner = useQrCameraScanner(videoRef, vi.fn())

    await scanner.start()

    expect(scanner.error.value).toBe('Permission denied')
    expect(scanner.isScanning.value).toBe(false)
  })

  it('stops the tracks and clears state on stop()', async () => {
    const video = createFakeVideo()
    const videoRef = ref<HTMLVideoElement | null>(video)
    stubAnimationFrame()
    const scanner = useQrCameraScanner(videoRef, vi.fn())
    await scanner.start()
    const stream = (await getUserMedia.mock.results[0]!
      .value) as FakeMediaStream
    const [track] = stream.getTracks()

    scanner.stop()

    expect(track!.stop).toHaveBeenCalled()
    expect(scanner.isScanning.value).toBe(false)
    expect(video.srcObject).toBeNull()
  })

  it('is a no-op to start when already scanning', async () => {
    const videoRef = ref<HTMLVideoElement | null>(createFakeVideo())
    stubAnimationFrame()
    const scanner = useQrCameraScanner(videoRef, vi.fn())
    await scanner.start()

    await scanner.start()

    expect(getUserMedia).toHaveBeenCalledTimes(1)
  })

  it('only acquires one camera stream when start() is called twice concurrently', async () => {
    const videoRef = ref<HTMLVideoElement | null>(createFakeVideo())
    stubAnimationFrame()
    const scanner = useQrCameraScanner(videoRef, vi.fn())

    await Promise.all([scanner.start(), scanner.start()])

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(scanner.isScanning.value).toBe(true)
  })

  it('releases the acquired stream if video.play() rejects', async () => {
    const video = createFakeVideo()
    video.play = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    const videoRef = ref<HTMLVideoElement | null>(video)
    stubAnimationFrame()
    const scanner = useQrCameraScanner(videoRef, vi.fn())

    await scanner.start()

    const stream = (await getUserMedia.mock.results[0]!
      .value) as FakeMediaStream
    const [track] = stream.getTracks()
    expect(track!.stop).toHaveBeenCalled()
    expect(scanner.error.value).toBe('NotAllowedError')
    expect(scanner.isScanning.value).toBe(false)
  })

  it('decodes a QR code from a scanned frame and stops itself', async () => {
    const video = createFakeVideo()
    Object.defineProperty(video, 'readyState', { value: 4 })
    Object.defineProperty(video, 'HAVE_ENOUGH_DATA', { value: 4 })
    Object.defineProperty(video, 'videoWidth', { value: 100 })
    Object.defineProperty(video, 'videoHeight', { value: 100 })

    const qr = create('scanned-offer-code', { errorCorrectionLevel: 'M' })
    const frame = rasterizeQrModules(qr.modules.size, qr.modules.data, 4, 4)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(frame)
    } as unknown as CanvasRenderingContext2D)

    const videoRef = ref<HTMLVideoElement | null>(video)
    const { runPendingFrame } = stubAnimationFrame()
    const onDecode = vi.fn()
    const scanner = useQrCameraScanner(videoRef, onDecode)

    await scanner.start()
    runPendingFrame()

    expect(onDecode).toHaveBeenCalledWith('scanned-offer-code')
    expect(scanner.isScanning.value).toBe(false)
  })
})
