import jsQR from 'jsqr'

/**
 * Decodes a single camera-frame RGBA pixel buffer for a QR code. Thin
 * wrapper over `jsqr` — kept as a seam so `use-qr-camera-scanner.ts` can be
 * tested without a real `jsQR` decode on every frame.
 */
export function decodeQrFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): string | null {
  return jsQR(data, width, height)?.data ?? null
}
