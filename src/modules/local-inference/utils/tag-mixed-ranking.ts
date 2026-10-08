/**
 * Putting two kinds of tag score on one scale.
 *
 * The head scores catalog tags and name similarity scores every other tag, and
 * the two have unrelated scales: mixing them raw measured worse than ignoring
 * the second group. So each tag's score is standardised against how that same
 * scorer scores a shipped set of ordinary entries, which makes "unusually
 * high for this tag" comparable across tags. No threshold is ever applied to
 * the result — it only orders.
 */

import { rankTags } from './tag-head-scoring'

import type { TagHead, TagReference } from '../tag-head-types'

/** Floor for a spread, so a tag that barely varies cannot dominate the list. */
const MIN_SPREAD = 1e-6

interface Spread {
  mean: number
  spread: number
}

function spreadOf(scores: readonly number[]): Spread {
  const mean = scores.reduce((sum, x) => sum + x, 0) / scores.length
  const variance =
    scores.reduce((sum, x) => sum + (x - mean) ** 2, 0) / scores.length
  return { mean, spread: Math.max(Math.sqrt(variance), MIN_SPREAD) }
}

function standardise(score: number, { mean, spread }: Spread): number {
  return (score - mean) / spread
}

/** Cosine similarity of two unit vectors. */
export function similarity(a: readonly number[], b: readonly number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] ?? 0) * (b[i] ?? 0)
  return sum
}

const headSpreads = new WeakMap<TagHead, Map<string, Spread>>()
/** Keyed by the name vector object, which the caller caches per tag name. */
const nameSpreads = new WeakMap<readonly number[], Spread>()

/** How the head scores each of its tags across the reference entries. */
function spreadsFor(
  head: TagHead,
  reference: TagReference
): Map<string, Spread> {
  const cached = headSpreads.get(head)
  if (cached) return cached

  const byTag = new Map<string, number[]>()
  for (const vector of reference.vectors) {
    for (const { score, tag } of rankTags(head, vector)) {
      const scores = byTag.get(tag) ?? []
      scores.push(score)
      byTag.set(tag, scores)
    }
  }
  const spreads = new Map<string, Spread>()
  for (const [tag, scores] of byTag) spreads.set(tag, spreadOf(scores))
  headSpreads.set(head, spreads)
  return spreads
}

/**
 * The head's score for every catalog tag, standardised.
 *
 * @returns Standardised score by catalog tag name.
 */
export function standardisedHeadScores(
  head: TagHead,
  reference: TagReference,
  vector: readonly number[]
): Map<string, number> {
  const spreads = spreadsFor(head, reference)
  const out = new Map<string, number>()
  for (const { score, tag } of rankTags(head, vector)) {
    const spread = spreads.get(tag)
    if (spread) out.set(tag, standardise(score, spread))
  }
  return out
}

/**
 * Name similarity for one tag, standardised against the reference entries.
 *
 * @param entryVector - The entry's embedding.
 * @param nameVector - The tag name's embedding.
 */
export function standardisedNameScore(
  reference: TagReference,
  entryVector: readonly number[],
  nameVector: readonly number[]
): number {
  let spread = nameSpreads.get(nameVector)
  if (!spread) {
    spread = spreadOf(
      reference.vectors.map((vector) => similarity(vector, nameVector))
    )
    nameSpreads.set(nameVector, spread)
  }
  return standardise(similarity(entryVector, nameVector), spread)
}
