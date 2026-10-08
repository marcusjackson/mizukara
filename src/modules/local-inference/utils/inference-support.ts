/**
 * Device capability check
 *
 * Local inference runs the embedding model on the processor, in a worker, on
 * WebAssembly. It is single-threaded: several threads would need shared
 * memory, which needs a cross-origin isolation this app deliberately does not
 * have, and a model this small does not need them. So the two things that
 * must exist are a worker and WebAssembly; the graphics chip is irrelevant.
 */

import type { LocalInferenceUnsupportedReason } from '../local-inference-types'

/**
 * Ask the browser whether it can run local inference.
 *
 * Reads through a `globalThis` index so a runtime guard is not narrowed away
 * as dead code by the type definitions, which describe both as always present.
 *
 * @returns Why it cannot, or null when it can.
 */
export function probeInferenceSupport(): LocalInferenceUnsupportedReason | null {
  const scope = globalThis as unknown as Record<string, unknown>

  if (typeof scope['Worker'] !== 'function') {
    return 'no-worker'
  }
  if (
    typeof scope['WebAssembly'] !== 'object' ||
    scope['WebAssembly'] === null
  ) {
    return 'no-webassembly'
  }
  return null
}

/** A sentence a person can act on, for each way the check can fail. */
export function describeUnsupportedReason(
  reason: LocalInferenceUnsupportedReason
): string {
  return reason === 'no-worker'
    ? 'This browser cannot run background workers, which suggesting tags with a local model requires.'
    : 'This browser has WebAssembly switched off or unsupported, which suggesting tags with a local model requires.'
}
