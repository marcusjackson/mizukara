import { describe, expect, it } from 'vitest'

import { EMBEDDING_MODEL } from './embedding-model'
import { rankTags } from './tag-head-scoring'

import type { TagHead } from '../tag-head-types'

function makeHead(overrides: Partial<TagHead> = {}): TagHead {
  return {
    bias: [0, 0],
    mean: [0, 0],
    model: EMBEDDING_MODEL,
    scale: [1, 1],
    tags: ['sleep', 'work'],
    training: { entries: 0, epochs: 0, l2: 0, learningRate: 0 },
    weights: [
      [1, 0],
      [0, 1]
    ],
    ...overrides
  }
}

describe('rankTags', () => {
  it('should rank the tag whose weights line up with the vector first', () => {
    const ranked = rankTags(makeHead(), [0.2, 0.9])

    expect(ranked.map((r) => r.tag)).toEqual(['work', 'sleep'])
  })

  it('should standardise each dimension with the head mean and scale', () => {
    const head = makeHead({ mean: [1, 0], scale: [0.5, 1] })

    const ranked = rankTags(head, [2, 0.5])

    expect(ranked).toEqual([
      { score: 2, tag: 'sleep' },
      { score: 0.5, tag: 'work' }
    ])
  })

  it('should add each tag bias to its score', () => {
    const ranked = rankTags(makeHead({ bias: [0, 5] }), [1, 0])

    expect(ranked[0]).toEqual({ score: 5, tag: 'work' })
  })

  it('should refuse a vector whose length does not match the head', () => {
    expect(() => rankTags(makeHead(), [1, 2, 3])).toThrow(/3 dimensions/)
  })
})
