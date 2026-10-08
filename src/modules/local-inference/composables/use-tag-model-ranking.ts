/**
 * Tag Model Ranking
 *
 * Ranks an entry's candidate tags with the on-device model: tags named like a
 * catalog tag by the shipped head, every other tag by how close its name is to
 * the entry in meaning. Both scores are standardised (see
 * `tag-mixed-ranking.ts`) so the two kinds sort into one list.
 *
 * This needs the model, which the person downloads from Settings; it never
 * starts a download. When the model cannot contribute it returns a notice
 * saying why instead of throwing.
 */

import {
  standardisedHeadScores,
  standardisedNameScore
} from '../utils/tag-mixed-ranking'

import { useLocalInferenceEngine } from './use-local-inference-engine'

import type { TagSuggestion } from '../local-inference-types'
import type { ShippedScorer } from '../tag-head-types'
import type { TagInputOption } from '@/shared/types/tag-types'

export interface ModelRanking {
  ranked: TagSuggestion[]
  /** Why the model could not contribute, when it could not. */
  notice: string | null
}

/**
 * Tag-name vectors by lowercased name. Derived from the one embedding model
 * and recomputed on the next page load; a renamed tag has a new key.
 */
const nameVectors = new Map<string, number[]>()

async function vectorForName(name: string): Promise<number[] | null> {
  const key = name.toLowerCase()
  const known = nameVectors.get(key)
  if (known) return known
  const vector = await useLocalInferenceEngine().embed(name)
  if (vector) nameVectors.set(key, vector)
  return vector
}

/** Whether the model is in a state to embed, or why not. */
async function unavailableNotice(): Promise<string | null> {
  const engine = useLocalInferenceEngine()
  await engine.initialize()

  if (engine.state.value === 'unsupported') {
    return 'This device cannot run the tag model. Suggestions from words in your entry still work.'
  }
  if (engine.state.value === 'downloading') {
    return 'The tag model is still downloading. Try again once it has finished.'
  }
  if (!engine.installState.value.isInstalled) {
    // Downloading is a decision with a size attached, and it belongs on the
    // screen that shows the size — not behind this button.
    return 'The tag model has not been downloaded yet. You can get it in Settings.'
  }
  return null
}

/**
 * Rank tags for one entry.
 *
 * @param linked - Tags named like a catalog tag, by lowercased catalog name.
 * @param others - Every other available tag.
 * @param isCurrent - Whether this run is still the latest. Checked between
 *   name embeds, so a superseded run stops asking the engine for work and
 *   leaves it free for the run that replaced it.
 */
export async function rankWithModel(
  { head, reference }: ShippedScorer,
  entryText: string,
  linked: ReadonlyMap<string, readonly TagInputOption[]>,
  others: readonly TagInputOption[],
  isCurrent: () => boolean = () => true
): Promise<ModelRanking> {
  const notice = await unavailableNotice()
  if (notice !== null) return { notice, ranked: [] }

  const engine = useLocalInferenceEngine()
  const entryVector = await engine.embed(entryText)
  if (entryVector === null) {
    return {
      notice: engine.error.value ?? 'The tag model could not read this entry.',
      ranked: []
    }
  }

  const scored: { suggestion: TagSuggestion; z: number }[] = []

  const headScores = standardisedHeadScores(head, reference, entryVector)
  for (const [catalogName, tags] of linked) {
    const z = headScores.get(catalogName)
    if (z === undefined) continue
    // Tags differing only in case share one catalog name and one score.
    for (const tag of tags) {
      scored.push({ suggestion: { name: tag.label, tagId: tag.value }, z })
    }
  }

  // One at a time: the engine refuses a second request while it is busy.
  for (const tag of others) {
    if (!isCurrent()) return { notice: null, ranked: [] }
    const nameVector = await vectorForName(tag.label)
    if (nameVector === null) {
      // A failure tears the model down, so carrying on would reload it for
      // every remaining name. Stop and let the caller word-match instead.
      return {
        notice:
          engine.error.value ?? 'The tag model could not read your tag names.',
        ranked: []
      }
    }
    scored.push({
      suggestion: { name: tag.label, tagId: tag.value },
      z: standardisedNameScore(reference, entryVector, nameVector)
    })
  }

  scored.sort((a, b) => b.z - a.z)
  return { notice: null, ranked: scored.map((s) => s.suggestion) }
}
