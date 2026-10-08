import type { RankedTag, TagHead } from '../tag-head-types'

/**
 * Rank the head's tags for one entry vector, best first.
 *
 * The scores are logits: they order tags well but are not calibrated, so
 * callers use the order and never a threshold.
 */
export function rankTags(
  head: TagHead,
  vector: readonly number[]
): RankedTag[] {
  const dimensions = head.mean.length
  if (vector.length !== dimensions) {
    throw new Error(
      `Vector has ${String(vector.length)} dimensions, the head expects ${String(dimensions)}`
    )
  }
  const standardised = vector.map(
    (value, index) =>
      (value - (head.mean[index] ?? 0)) / (head.scale[index] ?? 1)
  )
  return head.tags
    .map((tag, t) => {
      const weights = head.weights[t] ?? []
      let score = head.bias[t] ?? 0
      for (let index = 0; index < dimensions; index++) {
        score += (weights[index] ?? 0) * (standardised[index] ?? 0)
      }
      return { score, tag }
    })
    .sort((a, b) => b.score - a.score)
}
