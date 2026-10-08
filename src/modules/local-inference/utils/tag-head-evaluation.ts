import type { RankedTag } from '../tag-head-types'

/** What a person would and would not choose for one evaluation entry. */
export interface TagGold {
  primary: string[]
  acceptable: string[]
  wrong: string[]
}

export interface EntryMetrics {
  hitAt1: number
  hitAt3: number
  precisionAt3: number
  primaryRecallAt5: number
}

/** Metrics for one entry's ranking. "Good" is a primary or acceptable tag. */
export function entryMetrics(ranked: RankedTag[], gold: TagGold): EntryMetrics {
  const good = new Set([...gold.primary, ...gold.acceptable])
  const order = ranked.map((r) => r.tag)
  const top3 = order.slice(0, 3)
  const top5 = order.slice(0, 5)
  return {
    hitAt1: good.has(order[0] ?? '') ? 1 : 0,
    hitAt3: top3.some((tag) => good.has(tag)) ? 1 : 0,
    precisionAt3: top3.filter((tag) => good.has(tag)).length / 3,
    primaryRecallAt5:
      gold.primary.length === 0
        ? 1
        : gold.primary.filter((tag) => top5.includes(tag)).length /
          gold.primary.length
  }
}

/** Mean of each metric, plus the composite the spike used to compare heads. */
export function averageMetrics(
  all: EntryMetrics[]
): EntryMetrics & { composite: number } {
  const mean = (pick: (m: EntryMetrics) => number): number =>
    all.reduce((sum, m) => sum + pick(m), 0) / all.length
  const hitAt3 = mean((m) => m.hitAt3)
  const precisionAt3 = mean((m) => m.precisionAt3)
  const primaryRecallAt5 = mean((m) => m.primaryRecallAt5)
  return {
    composite: (hitAt3 + precisionAt3 + primaryRecallAt5) / 3,
    hitAt1: mean((m) => m.hitAt1),
    hitAt3,
    precisionAt3,
    primaryRecallAt5
  }
}
