/**
 * UUID Generation Utility
 *
 * Wrapper around browser's crypto.randomUUID() for UUID v4 generation.
 */

/**
 * Generate UUID v4 string
 *
 * Uses browser's native crypto.randomUUID() API for cryptographically
 * secure random UUIDs.
 *
 * @returns UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * @throws {Error} If crypto.randomUUID is not supported in environment
 *
 * @example
 * const id = generateUUID()
 * console.log(id) // '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined') {
    return crypto.randomUUID()
  }
  throw new Error('crypto.randomUUID is not supported in this environment')
}
