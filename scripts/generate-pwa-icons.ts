/**
 * Generate PWA Icons
 *
 * Creates placeholder PWA icons with the 記 character on the theme color background.
 * Run with: npx tsx scripts/generate-pwa-icons.ts
 *
 * For production, consider replacing with professionally designed icons.
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const THEME_COLOR = '#5a8a94'
const TEXT_COLOR = '#ffffff'
const CHARACTER = '自'

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

const sizes = [192, 512]

for (const size of sizes) {
  const svg = generateSvg(size)
  const filename = `pwa-${String(size)}x${String(size)}.svg`
  const filepath = resolve(import.meta.dirname, '..', 'public', filename)
  writeFileSync(filepath, svg, 'utf-8')
  console.log(`Generated ${filename}`)
}

console.log('\nNote: SVG icons generated. For PNG conversion, use a tool like:')
console.log('  - https://cloudconvert.com/svg-to-png')
console.log('  - Inkscape CLI: inkscape -w 192 -h 192 input.svg -o output.png')
console.log(
  '\nOr use the SVGs directly - modern browsers support SVG PWA icons.'
)
