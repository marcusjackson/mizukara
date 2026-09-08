/**
 * Tests for text-utils
 */

import { describe, expect, it } from 'vitest'

import { SNIPPET_MAX_LENGTH, truncateSnippet } from './text-utils'

describe('truncateSnippet', () => {
  it('returns content unchanged when at or under maxLength', () => {
    expect(truncateSnippet('short content', 20)).toBe('short content')
  })

  it('returns content unchanged when exactly maxLength', () => {
    const content = 'a'.repeat(20)
    expect(truncateSnippet(content, 20)).toBe(content)
  })

  it('trims back to the nearest preceding word boundary', () => {
    const content = 'The quick brown fox jumps over the lazy dog'
    expect(truncateSnippet(content, 20)).toBe('The quick brown fox…')
  })

  it('cuts at the hard limit when no word boundary exists in the span', () => {
    const content = `${'a'.repeat(25)} rest of the sentence`
    expect(truncateSnippet(content, 20)).toBe(`${'a'.repeat(20)}…`)
  })

  it('appends a trailing ellipsis only when truncated', () => {
    expect(truncateSnippet('exactly ten', 20)).not.toContain('…')
    expect(truncateSnippet('this is definitely longer than ten', 10)).toContain(
      '…'
    )
  })

  it('defaults maxLength to SNIPPET_MAX_LENGTH (200)', () => {
    const content = 'word '.repeat(60) // 300 chars
    const result = truncateSnippet(content)

    expect(result.endsWith('…')).toBe(true)
    // Everything before the ellipsis must fit within the 200-char cap
    expect(result.length - 1).toBeLessThanOrEqual(SNIPPET_MAX_LENGTH)
  })

  it('handles empty string', () => {
    expect(truncateSnippet('', 20)).toBe('')
  })
})
