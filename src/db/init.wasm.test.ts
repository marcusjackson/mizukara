/**
 * public/sql-wasm-browser.wasm is a committed copy of the binary the installed sql.js ships. A sql.js
 * bump that leaves the old copy behind loads a mismatched wasm and the app never starts, which no unit
 * test sees (they run sql.js from node_modules). This keeps the copy in step with the package.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Vitest runs from the project root.
const root = `${process.cwd()}/`;

describe('public sql.js wasm', () => {
  it('matches the installed sql.js build (copy node_modules/sql.js/dist/sql-wasm-browser.wasm to public/)', () => {
    const shipped = readFileSync(`${root}public/sql-wasm-browser.wasm`);
    const installed = readFileSync(`${root}node_modules/sql.js/dist/sql-wasm-browser.wasm`);
    expect(shipped.equals(installed)).toBe(true);
  });
});
