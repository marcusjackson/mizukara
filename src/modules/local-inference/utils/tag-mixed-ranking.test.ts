import { describe, expect, it } from 'vitest'

import head from '../tag-head.json'
import reference from '../tag-reference.json'

import {
  similarity,
  standardisedHeadScores,
  standardisedNameScore
} from './tag-mixed-ranking'

import type { TagHead, TagReference } from '../tag-head-types'

const shippedHead: TagHead = head
const shippedReference: TagReference = reference

/** A unit vector along one axis, as wide as the model output. */
const axis = (index: number): number[] =>
  Array.from({ length: shippedHead.mean.length }, (_, i) =>
    i === index ? 1 : 0
  )

describe('similarity', () => {
  it('should be the dot product of unit vectors', () => {
    expect(similarity(axis(0), axis(0))).toBe(1)
    expect(similarity(axis(0), axis(1))).toBe(0)
  })
})

describe('standardisedHeadScores', () => {
  it('should give every catalog tag a finite score', () => {
    const scores = standardisedHeadScores(
      shippedHead,
      shippedReference,
      shippedReference.vectors[0] ?? []
    )

    expect(scores.size).toBe(shippedHead.tags.length)
    for (const z of scores.values()) {
      expect(Number.isFinite(z)).toBe(true)
    }
  })

  it('should centre each tag on the reference entries', () => {
    const perTag = new Map<string, number[]>()
    for (const vector of shippedReference.vectors) {
      for (const [tag, z] of standardisedHeadScores(
        shippedHead,
        shippedReference,
        vector
      )) {
        perTag.set(tag, [...(perTag.get(tag) ?? []), z])
      }
    }

    for (const zs of perTag.values()) {
      const mean = zs.reduce((a, b) => a + b, 0) / zs.length
      expect(Math.abs(mean)).toBeLessThan(1e-6)
    }
  })
})

describe('standardisedNameScore', () => {
  it('should score a name close to the entry above one far from it', () => {
    const entry = shippedReference.vectors[0] ?? []
    const far = entry.map((x) => -x)

    expect(
      standardisedNameScore(shippedReference, entry, entry)
    ).toBeGreaterThan(standardisedNameScore(shippedReference, entry, far))
  })

  it('should not blow up for a name vector the reference entries cannot tell apart', () => {
    const flat = axis(0)
    const same: TagReference = {
      ...shippedReference,
      vectors: shippedReference.vectors.map(() => axis(1))
    }

    expect(Number.isFinite(standardisedNameScore(same, axis(1), flat))).toBe(
      true
    )
  })
})

describe('shipped reference entries', () => {
  it('should record exactly the embedding pipeline the head was trained with', () => {
    expect(shippedReference.model).toEqual(shippedHead.model)
  })

  it('should be as wide as the model output', () => {
    expect(shippedReference.vectors.length).toBeGreaterThan(1)
    for (const vector of shippedReference.vectors) {
      expect(vector).toHaveLength(shippedHead.mean.length)
    }
  })
})
