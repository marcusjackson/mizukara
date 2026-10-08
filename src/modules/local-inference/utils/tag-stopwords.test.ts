import { describe, expect, it } from 'vitest'

import { TAG_STOPWORDS } from './tag-stopwords'

describe('TAG_STOPWORDS', () => {
  it('should contain the function words tag extraction must never propose', () => {
    for (const word of ['the', 'and', 'my', 'about', 'was']) {
      expect(TAG_STOPWORDS.has(word)).toBe(true)
    }
  })

  it('should contain the high-frequency verbs that survive lemmatisation', () => {
    for (const word of ['get', 'got', 'go', 'going', 'went']) {
      expect(TAG_STOPWORDS.has(word)).toBe(true)
    }
  })

  it('should not contain words that make perfectly good tags', () => {
    for (const word of ['work', 'family', 'health', 'run', 'deadline']) {
      expect(TAG_STOPWORDS.has(word)).toBe(false)
    }
  })

  it('should be lowercase throughout, since callers lowercase before lookup', () => {
    for (const word of TAG_STOPWORDS) {
      expect(word).toBe(word.toLowerCase())
    }
  })
})
