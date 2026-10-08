import { describe, expect, it } from 'vitest'

import { matchExistingTags, stemWord } from './tag-term-matching'

const VOCABULARY = [
  'work',
  'family',
  'health',
  'travel',
  'gratitude',
  'stress',
  'exercise',
  'reading',
  'finance',
  'sleep'
]

describe('matchExistingTags', () => {
  it('should match a tag whose word appears in the entry', () => {
    const entry =
      'Went for a 5k run this morning before work, felt great afterward.'

    expect(matchExistingTags(entry, VOCABULARY)).toEqual(['work'])
  })

  it('should find nothing when no vocabulary word appears', () => {
    const entry =
      'Spent most of today buried in the quarterly report, the deadline snuck up on me.'

    expect(matchExistingTags(entry, VOCABULARY)).toEqual([])
  })

  it('should match regardless of case', () => {
    expect(matchExistingTags('A day of WORK', VOCABULARY)).toEqual(['work'])
  })

  it('should match a plural in the entry against a singular tag', () => {
    expect(matchExistingTags('Two long travels', ['travel'])).toEqual([
      'travel'
    ])
  })

  it('should match a singular in the entry against a plural tag', () => {
    expect(matchExistingTags('Went for a run', ['runs'])).toEqual(['runs'])
  })

  it('should match an -ing form against its base tag', () => {
    expect(matchExistingTags('Spent the evening reading', ['read'])).toEqual([
      'read'
    ])
  })

  it('should match a multi-word tag only as a phrase', () => {
    expect(
      matchExistingTags('We played board games all night', ['board games'])
    ).toEqual(['board games'])
  })

  it('should match a multi-word tag across the function words inside it', () => {
    expect(
      matchExistingTags('been in a rough state of mind lately', [
        'state of mind'
      ])
    ).toEqual(['state of mind'])
  })

  it('should match a multi-word tag whose entry wording adds a function word', () => {
    expect(
      matchExistingTags('the rest of the day was quiet', ['rest of day'])
    ).toEqual(['rest of day'])
  })

  it('should not match a multi-word tag from scattered words', () => {
    expect(
      matchExistingTags('The board met to discuss games', ['board games'])
    ).toEqual([])
  })

  it('should not match a tag hiding inside a longer word', () => {
    expect(matchExistingTags('We went to a party', ['art'])).toEqual([])
    expect(matchExistingTags('I started early', ['art'])).toEqual([])
  })

  it('should not match a very short tag at all', () => {
    expect(matchExistingTags('Here we go again', ['ai'])).toEqual([])
  })

  it('should return matches in vocabulary order', () => {
    const entry = 'Family stress about work'

    expect(matchExistingTags(entry, VOCABULARY)).toEqual([
      'work',
      'family',
      'stress'
    ])
  })

  it('should return nothing for an empty entry', () => {
    expect(matchExistingTags('   ', VOCABULARY)).toEqual([])
  })

  it('should return nothing when the vocabulary is empty', () => {
    expect(matchExistingTags('A day of work', [])).toEqual([])
  })

  it('should ignore a tag made only of stopwords', () => {
    expect(matchExistingTags('This and that', ['and'])).toEqual([])
  })
})

describe('stemWord', () => {
  it('should strip a plural', () => {
    expect(stemWord('parties')).toBe('party')
    expect(stemWord('walks')).toBe('walk')
  })

  it('should leave a short word alone rather than strip it to nothing', () => {
    expect(stemWord('bus')).toBe('bus')
    expect(stemWord('is')).toBe('is')
  })

  it('should strip a verb ending', () => {
    expect(stemWord('reading')).toBe('read')
    expect(stemWord('walked')).toBe('walk')
  })

  it('should lowercase what it returns', () => {
    expect(stemWord('Work')).toBe('work')
  })
})
