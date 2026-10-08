/**
 * Reading what the model returned, and what went wrong
 *
 * The pure parts of the worker's job, kept out of the worker so they can be
 * tested: the worker itself needs WebAssembly and a real model download
 * before it does anything at all.
 */

/**
 * Pull the vector out of what the feature-extraction pipeline returned.
 *
 * The library returns a tensor whose `data` is a typed array. A text embeds to
 * one row, so `data` is the vector itself. An unexpected shape is an ordinary
 * outcome rather than an error, and yields an empty vector for the caller to
 * reject.
 *
 * @returns The vector, or an empty array if there is nothing usable.
 */
export function readVector(output: unknown): number[] {
  const data = (output as { data?: unknown } | null)?.data
  if (data instanceof Float32Array || data instanceof Float64Array) {
    return Array.from(data)
  }
  return Array.isArray(data) && data.every((n) => typeof n === 'number')
    ? data
    : []
}

/**
 * Turn a thrown value into something worth showing a person.
 *
 * Running out of storage is called out by name because it is the likeliest
 * failure on a phone, and the only one with an obvious remedy.
 */
export function describeFailure(error: unknown): string {
  if (error instanceof Error) {
    return error.name === 'QuotaExceededError'
      ? 'There is not enough free storage for this model. Free some space and try again.'
      : error.message
  }
  return 'The model failed for an unknown reason.'
}
