import { rasterizeQrModules } from '@test/helpers/qr-fixtures'
import { create } from 'qrcode'
import { describe, expect, it } from 'vitest'

import { decodeQrFromImageData } from './qr-decode'

describe('decodeQrFromImageData', () => {
  it('decodes a real QR bitmap back to its original text', () => {
    const text = 'device-sync-offer-code'
    const qr = create(text, { errorCorrectionLevel: 'M' })
    const { data, height, width } = rasterizeQrModules(
      qr.modules.size,
      qr.modules.data,
      4,
      4
    )

    expect(decodeQrFromImageData(data, width, height)).toBe(text)
  })

  it('returns null when the frame has no QR code in it', () => {
    const blankFrame = new Uint8ClampedArray(100 * 100 * 4).fill(255)

    expect(decodeQrFromImageData(blankFrame, 100, 100)).toBeNull()
  })
})
