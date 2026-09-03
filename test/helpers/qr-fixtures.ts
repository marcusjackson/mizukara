/**
 * Test-only QR bitmap fixtures.
 *
 * Rasterizes a `qrcode` module matrix into an RGBA pixel buffer, the same
 * shape `CanvasRenderingContext2D#getImageData` hands a real camera frame.
 * Lets device-sync scanner tests exercise a genuine encode → decode round
 * trip without a browser canvas, which jsdom doesn't implement.
 */

export interface RasterizedQrFrame {
  data: Uint8ClampedArray
  width: number
  height: number
}

function paintModule(
  data: Uint8ClampedArray,
  dimensionPx: number,
  moduleX: number,
  moduleY: number,
  moduleSizePx: number,
  marginModules: number
): void {
  for (let dy = 0; dy < moduleSizePx; dy++) {
    for (let dx = 0; dx < moduleSizePx; dx++) {
      const px = (moduleX + marginModules) * moduleSizePx + dx
      const py = (moduleY + marginModules) * moduleSizePx + dy
      const pixelIndex = (py * dimensionPx + px) * 4
      data[pixelIndex] = 0
      data[pixelIndex + 1] = 0
      data[pixelIndex + 2] = 0
      data[pixelIndex + 3] = 255
    }
  }
}

export function rasterizeQrModules(
  size: number,
  modules: Uint8Array,
  moduleSizePx: number,
  marginModules: number
): RasterizedQrFrame {
  const dimensionPx = (size + marginModules * 2) * moduleSizePx
  const data = new Uint8ClampedArray(dimensionPx * dimensionPx * 4).fill(255)

  for (let moduleY = 0; moduleY < size; moduleY++) {
    for (let moduleX = 0; moduleX < size; moduleX++) {
      if (modules[moduleY * size + moduleX] !== 1) continue
      paintModule(
        data,
        dimensionPx,
        moduleX,
        moduleY,
        moduleSizePx,
        marginModules
      )
    }
  }

  return { data, height: dimensionPx, width: dimensionPx }
}
