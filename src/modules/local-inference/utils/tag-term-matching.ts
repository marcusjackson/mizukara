/**
 * Classical tag matching
 *
 * Suggests tags you already have, by matching the words in an entry against
 * the tag names themselves. No model, no download — this runs on every
 * device, including ones where the model cannot, and it serves every tag the
 * shipped classifier does not know.
 *
 * It cannot infer. An entry about counting pills will not be matched to a
 * "health" tag unless the word appears. That is the trade: it never invents a
 * tag either. Inferring a tag from meaning is the classifier's job.
 */

import { TAG_STOPWORDS } from './tag-stopwords'

/**
 * Shortest word that may be matched.
 *
 * Two-letter tags match inside too many longer words to be worth it even with
 * boundary matching — "ai" in "again" is the example that made this a rule.
 */
const MIN_MATCH_LENGTH = 3

/** Suffixes stripped to compare a word against a tag name. */
const SUFFIXES = ['ies', 'ing', 'es', 'ed', 's'] as const

/**
 * Reduce a word to a crude stem.
 *
 * Deliberately not a real stemmer: this runs synchronously on every
 * suggestion, and a proper stemmer is a dependency this does not need.
 * "parties" and "party" are close enough after this to match; "ran" and "run" are not, and that is accepted.
 */
export function stemWord(word: string): string {
  const lower = word.toLowerCase()
  for (const suffix of SUFFIXES) {
    if (lower.length > suffix.length + 2 && lower.endsWith(suffix)) {
      const trimmed = lower.slice(0, -suffix.length)
      return suffix === 'ies' ? `${trimmed}y` : trimmed
    }
  }
  return lower
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter((word) => word.length > 0)
}

/**
 * Whether a tag name appears in an entry.
 *
 * Single-word names are compared by stem against the entry's words. Multi-word
 * names are matched as a phrase against the stemmed word sequence, so
 * "board games" matches "played board games" but not a stray "board".
 *
 * The phrase comparison ignores function words on both sides. A tag named
 * "state of mind" carries no "of" once its stopwords are dropped, so the entry
 * must not either, or the phrase can never match the sentence it came from.
 * The cost is that "board the games" also matches "board games", which is a
 * far rarer sentence than the ones this makes matchable.
 *
 * Matching is always by whole word. A substring scan would fire "art" inside
 * "party" and "started", and this tier runs on every suggestion, so its false
 * positives are the ones people actually see.
 */
function isTagPresent(tagName: string, entryStems: string[]): boolean {
  const tagWords = tokenize(tagName)
    .filter((word) => !TAG_STOPWORDS.has(word))
    .map(stemWord)

  if (tagWords.length === 0) {
    return false
  }
  if (tagWords.some((word) => word.length < MIN_MATCH_LENGTH)) {
    return false
  }
  if (tagWords.length === 1) {
    return entryStems.includes(tagWords[0] ?? '')
  }

  const phraseStems = entryStems.filter((word) => !TAG_STOPWORDS.has(word))
  return phraseStems.some((_, index) =>
    tagWords.every((word, offset) => phraseStems[index + offset] === word)
  )
}

/**
 * Find which existing tags an entry's own words point at.
 *
 * @param entryText - The entry's full text.
 * @param tagNames - Every tag name in the vocabulary. Unbounded: this is a
 *   local scan, so vocabulary size costs nothing worth capping.
 * @returns The matching names, in the order they were given.
 */
export function matchExistingTags(
  entryText: string,
  tagNames: readonly string[]
): string[] {
  const entryStems = tokenize(entryText).map(stemWord)
  if (entryStems.length === 0) {
    return []
  }

  return tagNames.filter((name) => isTagPresent(name, entryStems))
}
