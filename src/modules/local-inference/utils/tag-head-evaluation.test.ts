import { describe, expect, it } from 'vitest'

import { averageMetrics, entryMetrics } from './tag-head-evaluation'

const ranked = (...tags: string[]) => tags.map((tag, i) => ({ score: -i, tag }))
const gold = { acceptable: ['stress'], primary: ['work'], wrong: ['pets'] }

describe('entryMetrics', () => {
  it('should count a primary or acceptable tag as a hit', () => {
    const m = entryMetrics(ranked('stress', 'pets', 'music', 'work'), gold)

    expect(m.hitAt1).toBe(1)
    expect(m.hitAt3).toBe(1)
  })

  it('should miss when no good tag is in the top three', () => {
    const m = entryMetrics(ranked('pets', 'music', 'tv', 'work'), gold)

    expect(m.hitAt3).toBe(0)
  })

  it('should score precision at three as the share of good tags in the top three', () => {
    const m = entryMetrics(ranked('work', 'pets', 'stress'), gold)

    expect(m.precisionAt3).toBeCloseTo(2 / 3)
  })

  it('should score primary recall at five over the primary tags only', () => {
    const m = entryMetrics(ranked('a', 'b', 'c', 'd', 'work'), {
      acceptable: [],
      primary: ['work', 'sleep'],
      wrong: []
    })

    expect(m.primaryRecallAt5).toBe(0.5)
  })
})

describe('averageMetrics', () => {
  it('should average each metric and the composite of hit@3, precision@3 and primary recall@5', () => {
    const all = [
      { hitAt1: 1, hitAt3: 1, precisionAt3: 1, primaryRecallAt5: 1 },
      { hitAt1: 0, hitAt3: 0, precisionAt3: 0, primaryRecallAt5: 0.5 }
    ]

    const m = averageMetrics(all)

    expect(m.hitAt1).toBe(0.5)
    expect(m.composite).toBeCloseTo((0.5 + 0.5 + 0.75) / 3)
  })
})
