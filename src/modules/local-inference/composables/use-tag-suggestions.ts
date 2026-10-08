/**
 * Tag Suggestions
 *
 * Suggests existing tags for one entry.
 *
 * With the model (which the person downloads from Settings; the editor never
 * starts a download) every available tag is ranked in one list: tags named like
 * a catalog tag by the shipped classifier head, every other tag by how close
 * its name is to the entry in meaning. See `use-tag-model-ranking.ts`.
 *
 * Without the model — missing, unsupported, or failed — tags are matched
 * literally instead: the entry's own words against the tag's name. It costs
 * nothing and runs on every device.
 *
 * Suggestions are never applied here. This produces a list; what to do with
 * it is the editor's decision, and the person's.
 */

import { type DeepReadonly, readonly, type Ref, ref } from 'vue'

import { matchExistingTags } from '../utils/tag-term-matching'

import { rankWithModel } from './use-tag-model-ranking'

import type { TagSuggestion } from '../local-inference-types'
import type { ShippedScorer } from '../tag-head-types'
import type { TagInputOption } from '@/shared/types/tag-types'

/** The most suggestions ever returned; the panel shows the first few of them. */
export const MAX_SUGGESTIONS = 10

export interface UseTagSuggestions {
  suggestions: DeepReadonly<Ref<TagSuggestion[]>>
  isWorking: DeepReadonly<Ref<boolean>>
  /** Why the model could not contribute, when it could not. Not fatal. */
  error: DeepReadonly<Ref<string | null>>
  /**
   * Produce suggestions for an entry.
   *
   * @param entryText - The entry's current text, including unsaved edits.
   * @param vocabulary - Every tag that exists, as the editor already has it.
   * @param assignedTagIds - Tags already on this entry, which are not
   *   suggested again.
   */
  suggest: (
    entryText: string,
    vocabulary: readonly TagInputOption[],
    assignedTagIds: readonly string[]
  ) => Promise<void>
  clear: () => void
}

let scorerPromise: Promise<ShippedScorer | null> | null = null

/**
 * Load the shipped head and its reference entries on first use, so a session
 * that never asks for a suggestion never fetches them. A chunk that fails to
 * load (offline, an evicted cache) is an ordinary outcome, not a throw: the
 * word matcher still serves.
 */
async function loadScorer(): Promise<ShippedScorer | null> {
  scorerPromise ??= Promise.all([
    import('../tag-head.json'),
    import('../tag-reference.json')
  ])
    .then(([head, reference]) => ({
      head: head.default,
      reference: reference.default
    }))
    .catch(() => null)
  return scorerPromise
}

/** Existing tags whose own words appear in the entry. */
function matchByWords(
  entryText: string,
  tags: readonly TagInputOption[]
): TagSuggestion[] {
  const matched = new Set(
    matchExistingTags(
      entryText,
      tags.map((tag) => tag.label)
    )
  )
  return tags
    .filter((tag) => matched.has(tag.label))
    .map((tag) => ({ name: tag.label, tagId: tag.value }))
}

/** What one suggestion run produced. */
interface SuggestionResult {
  suggestions: TagSuggestion[]
  error: string | null
}

async function computeSuggestions(
  entryText: string,
  vocabulary: readonly TagInputOption[],
  assigned: ReadonlySet<string>,
  isCurrent: () => boolean
): Promise<SuggestionResult> {
  const available = vocabulary.filter((tag) => !assigned.has(tag.value))
  const scorer = await loadScorer()
  const catalogNames = new Set(
    scorer?.head.tags.map((name) => name.toLowerCase())
  )

  const linked = new Map<string, TagInputOption[]>()
  const others: TagInputOption[] = []
  for (const tag of available) {
    const key = tag.label.toLowerCase()
    if (catalogNames.has(key)) {
      linked.set(key, [...(linked.get(key) ?? []), tag])
    } else {
      others.push(tag)
    }
  }

  if (scorer && available.length > 0) {
    const { notice, ranked } = await rankWithModel(
      scorer,
      entryText,
      linked,
      others,
      isCurrent
    )
    if (notice === null) {
      return { error: null, suggestions: ranked.slice(0, MAX_SUGGESTIONS) }
    }
    // Without the model every tag is word-matched, catalog-named ones included.
    return {
      error: notice,
      suggestions: matchByWords(entryText, available).slice(0, MAX_SUGGESTIONS)
    }
  }

  return {
    error: null,
    suggestions: matchByWords(entryText, available).slice(0, MAX_SUGGESTIONS)
  }
}

export function useTagSuggestions(): UseTagSuggestions {
  const suggestions = ref<TagSuggestion[]>([])
  const isWorking = ref(false)
  const error = ref<string | null>(null)

  /**
   * Identifies the latest run. A run whose id is no longer current was
   * superseded or cleared while it awaited, and must not write its result.
   */
  let currentRun = 0

  async function suggest(
    entryText: string,
    vocabulary: readonly TagInputOption[],
    assignedTagIds: readonly string[]
  ): Promise<void> {
    const run = ++currentRun
    isWorking.value = true
    error.value = null
    suggestions.value = []

    try {
      const result = await computeSuggestions(
        entryText,
        vocabulary,
        new Set(assignedTagIds),
        () => run === currentRun
      )
      if (run === currentRun) {
        suggestions.value = result.suggestions
        error.value = result.error
      }
    } catch {
      if (run === currentRun) {
        error.value = 'Suggestions could not be produced for this entry.'
      }
    } finally {
      if (run === currentRun) {
        isWorking.value = false
      }
    }
  }

  return {
    clear: () => {
      currentRun++
      isWorking.value = false
      suggestions.value = []
      error.value = null
    },
    error: readonly(error),
    isWorking: readonly(isWorking),
    suggest,
    suggestions: readonly(suggestions)
  }
}
