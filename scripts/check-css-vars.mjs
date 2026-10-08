#!/usr/bin/env node
/**
 * Fails when a `var(--name)` with no fallback names a custom property that no
 * file under src/ declares. Stylelint validates values, not that a custom
 * property exists, so a misspelled token otherwise resolves silently to unset.
 * Properties set by libraries at runtime (`--reka-*`) are exempt.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const EXEMPT_PREFIXES = ['--reka-']

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (/\.(vue|css|ts)$/.test(entry.name)) yield path
  }
}

const declared = new Set()
const references = []

for (const file of walk('src')) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)) {
      declared.add(match[1])
    }
    for (const match of line.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
      references.push({ name: match[1], where: `${file}:${index + 1}` })
    }
  })
}

const missing = references.filter(
  ({ name }) =>
    !declared.has(name) &&
    !EXEMPT_PREFIXES.some((prefix) => name.startsWith(prefix))
)

if (missing.length > 0) {
  console.error('Undefined CSS custom properties (no fallback given):')
  for (const { name, where } of missing) console.error(`  ${name}  ${where}`)
  process.exit(1)
}
console.log('CSS custom properties: all references are defined.')
