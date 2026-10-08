import { describe, expect, it } from 'vitest'

import catalog from './tag-catalog.json'
import head from './tag-head.json'

const catalogTags = Object.values(catalog).flat()

describe('starter tag catalog', () => {
  it('should hold about a hundred tags', () => {
    expect(catalogTags.length).toBeGreaterThanOrEqual(90)
    expect(catalogTags.length).toBeLessThanOrEqual(110)
  })

  it('should have no two tags that differ only by case, the rule tags already use to stay unique', () => {
    const folded = catalogTags.map((tag) => tag.toLowerCase())

    expect(new Set(folded).size).toBe(folded.length)
  })

  it('should spell every tag in lower case with no stray whitespace', () => {
    for (const tag of catalogTags) {
      expect(tag).toBe(tag.trim().toLowerCase())
    }
  })

  it('should be exactly the tags the shipped head scores, in the same order', () => {
    expect(head.tags).toEqual(catalogTags)
  })
})
