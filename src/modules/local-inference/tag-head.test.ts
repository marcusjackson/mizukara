import { describe, expect, it } from 'vitest'

import head from './tag-head.json'
import evalFixture from './tag-head-eval-fixture.json'
import { EMBEDDING_MODEL } from './utils/embedding-model'
import { averageMetrics, entryMetrics } from './utils/tag-head-evaluation'
import { rankTags } from './utils/tag-head-scoring'

import type { TagHead } from './tag-head-types'
import type { TagGold } from './utils/tag-head-evaluation'

const shippedHead: TagHead = head
const heldOut: { id: string; gold: TagGold; vector: number[] }[] = evalFixture

/**
 * The quality bar. Set once from the first head's own held-out measurement at
 * the final catalog size (composite 0.785, hit@3 0.950, 60 entries; five training entries too close to an evaluation entry were dropped first), less a
 * margin because 60 entries cannot resolve differences under about 0.04.
 * A change to the catalog, corpus or model must not lower it; raise it only
 * with a measurement that justifies it.
 */
const BAR = { composite: 0.74, hitAt3: 0.9 }

describe('shipped tag head', () => {
  it('should record exactly the embedding pipeline the app uses', () => {
    expect(shippedHead.model).toEqual(EMBEDDING_MODEL)
  })

  it('should have one weight row and one bias per tag, each as wide as the model output', () => {
    const { bias, mean, scale, tags, weights } = shippedHead

    expect(weights).toHaveLength(tags.length)
    expect(bias).toHaveLength(tags.length)
    expect(mean).toHaveLength(EMBEDDING_MODEL.dimensions)
    expect(scale).toHaveLength(EMBEDDING_MODEL.dimensions)
    for (const row of weights) {
      expect(row).toHaveLength(EMBEDDING_MODEL.dimensions)
    }
  })

  it('should only hold finite numbers, with a non-zero spread to divide by', () => {
    for (const value of [
      ...shippedHead.bias,
      ...shippedHead.mean,
      ...shippedHead.weights.flat()
    ]) {
      expect(Number.isFinite(value)).toBe(true)
    }
    for (const value of shippedHead.scale) {
      expect(value).toBeGreaterThan(0)
    }
  })

  it('should hold the quality it was built with on the held-out entries', () => {
    const metrics = averageMetrics(
      heldOut.map((e) => entryMetrics(rankTags(shippedHead, e.vector), e.gold))
    )

    expect(metrics.composite).toBeGreaterThanOrEqual(BAR.composite)
    expect(metrics.hitAt3).toBeGreaterThanOrEqual(BAR.hitAt3)
  })

  it('should not rank every entry the same', () => {
    const firsts = new Set(
      heldOut.map((e) => rankTags(shippedHead, e.vector)[0]?.tag)
    )

    expect(firsts.size).toBeGreaterThan(10)
  })
})
