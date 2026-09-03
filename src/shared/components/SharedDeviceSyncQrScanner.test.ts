import { rasterizeQrModules } from '@test/helpers/qr-fixtures'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { create } from 'qrcode'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SharedDeviceSyncQrScanner from './SharedDeviceSyncQrScanner.vue'

class FakeTrack {
  stop = vi.fn()
}

class FakeMediaStream {
  getTracks(): FakeTrack[] {
    return [new FakeTrack()]
  }
}

describe('SharedDeviceSyncQrScanner', () => {
  let getUserMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    getUserMedia = vi.fn().mockResolvedValue(new FakeMediaStream())
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('requests camera access as soon as it mounts', async () => {
    render(SharedDeviceSyncQrScanner)

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' }
      })
    })
  })

  it('shows an error with a retry action when camera access fails', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('Permission denied'))
    const user = userEvent.setup()
    render(SharedDeviceSyncQrScanner)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    )

    await user.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(2)
    })
  })

  it('emits scanned once a frame decodes a QR code', async () => {
    const { container, emitted } = render(SharedDeviceSyncQrScanner)
    const video = container.querySelector('video')
    if (!video)
      throw new Error('expected the scanner to render a <video> element')
    Object.defineProperty(video, 'readyState', { value: 4 })
    Object.defineProperty(video, 'HAVE_ENOUGH_DATA', { value: 4 })
    Object.defineProperty(video, 'videoWidth', { value: 100 })
    Object.defineProperty(video, 'videoHeight', { value: 100 })

    const qr = create('component-scanned-code', { errorCorrectionLevel: 'M' })
    const frame = rasterizeQrModules(qr.modules.size, qr.modules.data, 4, 4)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(frame)
    } as unknown as CanvasRenderingContext2D)

    await waitFor(() => {
      expect(emitted()['scanned']).toBeTruthy()
    })
    expect(emitted()['scanned']?.[0]).toEqual(['component-scanned-code'])
  })
})
