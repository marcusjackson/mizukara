/**
 * Generate PWA Icons
 *
 * Creates placeholder PWA icons with the 自 character on the theme color background.
 * Run with: npx tsx scripts/generate-pwa-icons.ts
 *
 * This script generates both SVG and PNG icons:
 * - SVG: Vector format for modern browsers
 * - PNG: Raster format required by Android Chrome for PWA install banners
 *
 * For production, consider replacing with professionally designed icons.
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const THEME_COLOR = '#5a8a94'
const TEXT_COLOR = '#ffffff'
const CHARACTER = '自'
// Theme color components: #5a8a94 = rgb(90, 138, 148)
const THEME_RGB = { r: 90, g: 138, b: 148 }

function generateSvg(size: number): string {
  const fontSize = Math.floor(size * 0.6)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${String(size)}" height="${String(size)}" viewBox="0 0 ${String(size)} ${String(size)}">
  <rect width="${String(size)}" height="${String(size)}" fill="${THEME_COLOR}"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif"
    font-size="${String(fontSize)}"
    font-weight="bold"
    fill="${TEXT_COLOR}"
  >${CHARACTER}</text>
</svg>`
}

/**
 * Generate a solid-color PNG using raw bytes (no external dependencies).
 * Produces a valid PNG with the theme background color.
 */
function generateSolidPng(
  size: number,
  r: number,
  g: number,
  b: number
): Buffer {
  const crc32 = (buf: Buffer): number => {
    const table = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[i] = c
    }
    let crc = 0xffffffff
    for (const byte of buf)
      crc = (crc >>> 8) ^ (table[(crc ^ byte) & 0xff] ?? 0)
    return (crc ^ 0xffffffff) >>> 0
  }

  const chunk = (type: string, data: Buffer): Buffer => {
    const typeBuf = Buffer.from(type, 'ascii')
    const lenBuf = Buffer.allocUnsafe(4)
    lenBuf.writeUInt32BE(data.length)
    const crcBuf = Buffer.allocUnsafe(4)
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrData = Buffer.allocUnsafe(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 2 // color type: RGB
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = chunk('IHDR', ihdrData)

  const row = Buffer.allocUnsafe(1 + size * 3)
  row[0] = 0 // filter type: None
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[2 + x * 3] = g
    row[3 + x * 3] = b
  }
  const rawData = Buffer.concat(Array.from({ length: size }, () => row))

  // Use sync deflate via Node built-in zlib
  const deflated = deflateSync(rawData)
  const idat = chunk('IDAT', deflated)
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

const sizes = [192, 512]

for (const size of sizes) {
  const svg = generateSvg(size)
  const svgFilename = `pwa-${String(size)}x${String(size)}.svg`
  const svgFilepath = resolve(__dirname, '..', 'public', svgFilename)
  writeFileSync(svgFilepath, svg, 'utf-8')
  console.log(`Generated ${svgFilename}`)

  const png = generateSolidPng(size, THEME_RGB.r, THEME_RGB.g, THEME_RGB.b)
  const pngFilename = `pwa-${String(size)}x${String(size)}.png`
  const pngFilepath = resolve(__dirname, '..', 'public', pngFilename)
  writeFileSync(pngFilepath, png)
  console.log(`Generated ${pngFilename}`)
}

console.log('\nIcons generated:')
console.log('  SVG: Vector format for modern browsers')
console.log(
  '  PNG: Raster format required by Android Chrome for PWA install banners'
)
console.log(
  '\nFor production, consider replacing with professionally designed icons.'
)
