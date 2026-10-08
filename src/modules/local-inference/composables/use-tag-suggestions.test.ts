import { ref } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import head from '../tag-head.json'
import evalFixture from '../tag-head-eval-fixture.json'
import { rankTags } from '../utils/tag-head-scoring'

import { MAX_SUGGESTIONS, useTagSuggestions } from './use-tag-suggestions'

import type { TagInputOption } from '@/shared/types/tag-types'

const embed = vi.fn<(text: string) => Promise<number[] | null>>()
const initialize = vi.fn<() => Promise<void>>()
const engineState = ref('idle')
const engineError = ref<string | null>(null)
const installState = ref({ hasAnyFiles: true, isInstalled: true })

vi.mock('./use-local-inference-engine', () => ({
  useLocalInferenceEngine: () => ({
    embed: (text: string) => embed(text),
    error: engineError,
    initialize: () => initialize(),
    installState,
    state: engineState
  })
}))

const fixtureEntry = evalFixture[0]!
/** The tag the shipped head ranks first for the fixture entry's vector. */
const TOP_TAG = rankTags(head, fixtureEntry.vector)[0]?.tag ?? ''

const tag = (label: string): TagInputOption => ({
  label,
  value: `tag-${label}`
})

describe('useTagSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    engineState.value = 'idle'
    engineError.value = null
    installState.value = { hasAnyFiles: true, isInstalled: true }
    initialize.mockResolvedValue(undefined)
    embed.mockResolvedValue(fixtureEntry.vector)
  })

  describe('catalog-named tags', () => {
    it('should rank them with the model, best first', async () => {
      const { suggest, suggestions } = useTagSuggestions()

      await suggest(
        'Counting pills',
        [tag('sleep'), tag('health'), tag('tv')],
        []
      )

      expect(suggestions.value.length).toBeGreaterThan(0)
      expect(embed).toHaveBeenCalledTimes(1)
    })

    it('should put the head-preferred tag before a lower-ranked one', async () => {
      const { suggest, suggestions } = useTagSuggestions()
      const others = ['sleep', 'tv', 'garden'].filter((n) => n !== TOP_TAG)

      await suggest(
        'Any text',
        [tag(others[0]!), tag(TOP_TAG), tag(others[1]!)],
        []
      )

      expect(suggestions.value[0]?.name).toBe(TOP_TAG)
    })

    it('should match the catalog name ignoring case', async () => {
      const { suggest, suggestions } = useTagSuggestions()

      await suggest('Any text', [tag(TOP_TAG.toUpperCase())], [])

      expect(suggestions.value).toHaveLength(1)
    })

    it('should never suggest a tag the entry already carries', async () => {
      const { suggest, suggestions } = useTagSuggestions()

      await suggest(
        'Any text',
        [tag(TOP_TAG), tag('sleep')],
        [`tag-${TOP_TAG}`]
      )

      expect(suggestions.value.map((s) => s.name)).not.toContain(TOP_TAG)
    })

    it('should only ever return tags from the vocabulary', async () => {
      const { suggest, suggestions } = useTagSuggestions()

      await suggest('Any text', [tag('sleep')], [])

      expect(suggestions.value).toEqual([{ name: 'sleep', tagId: 'tag-sleep' }])
    })

    it('should return at most ten', async () => {
      const { suggest, suggestions } = useTagSuggestions()
      const names = [
        'health',
        'illness',
        'injury',
        'fitness',
        'running',
        'yoga',
        'sleep',
        'nutrition',
        'stress',
        'burnout',
        'gratitude',
        'work'
      ]

      await suggest('Any text', names.map(tag), [])

      expect(suggestions.value).toHaveLength(MAX_SUGGESTIONS)
    })
  })

  describe('tags outside the catalog', () => {
    const entryVector = fixtureEntry.vector
    const opposite = entryVector.map((x) => -x)
    const byText = (vectors: Record<string, number[]>) =>
      embed.mockImplementation((text) =>
        Promise.resolve(vectors[text] ?? entryVector)
      )

    it('should be ranked by how close their name is to the entry', async () => {
      byText({ 'near-name': entryVector, 'far-name': opposite })
      const { suggest, suggestions } = useTagSuggestions()

      await suggest('Any text', [tag('far-name'), tag('near-name')], [])

      expect(suggestions.value.map((s) => s.name)).toEqual([
        'near-name',
        'far-name'
      ])
    })

    it('should share one list with catalog-named tags', async () => {
      byText({ 'mine-a': entryVector })
      const { suggest, suggestions } = useTagSuggestions()

      await suggest('Any text', [tag('mine-a'), tag(TOP_TAG)], [])

      expect(suggestions.value.map((s) => s.name).sort()).toEqual(
        ['mine-a', TOP_TAG].sort()
      )
    })

    it('should not embed a tag name twice', async () => {
      const { suggest } = useTagSuggestions()

      await suggest('First', [tag('cached-name')], [])
      await suggest('Second', [tag('cached-name')], [])

      expect(
        embed.mock.calls.filter(([text]) => text === 'cached-name')
      ).toHaveLength(1)
    })

    it('should fall back to words for everything when a name cannot be embedded', async () => {
      embed.mockImplementation((text) =>
        Promise.resolve(text === 'unreadable-name' ? null : entryVector)
      )
      engineError.value = 'model failed'
      const { error, suggest, suggestions } = useTagSuggestions()

      await suggest(
        'unreadable-name and readable-name',
        [tag('unreadable-name'), tag('readable-name')],
        []
      )

      expect(error.value).toBe('model failed')
      expect(suggestions.value.map((s) => s.name)).toEqual([
        'unreadable-name',
        'readable-name'
      ])
    })

    it('should stop embedding names once a newer run has started', async () => {
      const { suggest } = useTagSuggestions()

      const first = suggest('One', [tag('stale-a'), tag('stale-b')], [])
      await suggest('Two', [], [])
      await first

      expect(
        embed.mock.calls.filter(([text]) => text === 'stale-b')
      ).toHaveLength(0)
    })

    it('should be matched by their own words when there is no model', async () => {
      installState.value = { hasAnyFiles: false, isInstalled: false }
      const { suggest, suggestions } = useTagSuggestions()

      await suggest('Dinner with the Hendersons', [tag('hendersons')], [])

      expect(suggestions.value).toEqual([
        { name: 'hendersons', tagId: 'tag-hendersons' }
      ])
    })
  })

  describe('without a usable model', () => {
    it('should point to Settings and fall back to words when not downloaded', async () => {
      installState.value = { hasAnyFiles: false, isInstalled: false }
      const { error, suggest, suggestions } = useTagSuggestions()

      await suggest('A long day of work', [tag('work')], [])

      expect(embed).not.toHaveBeenCalled()
      expect(error.value).toContain('Settings')
      expect(suggestions.value).toEqual([{ name: 'work', tagId: 'tag-work' }])
    })

    it('should say so and fall back to words on an unsupported device', async () => {
      engineState.value = 'unsupported'
      const { error, suggest, suggestions } = useTagSuggestions()

      await suggest('A long day of work', [tag('work')], [])

      expect(embed).not.toHaveBeenCalled()
      expect(error.value).toContain('cannot run')
      expect(suggestions.value).toHaveLength(1)
    })

    it('should surface an engine failure without losing word matches', async () => {
      embed.mockResolvedValue(null)
      engineError.value = 'out of memory'
      const { error, suggest, suggestions } = useTagSuggestions()

      await suggest('A long day of work', [tag('work')], [])

      expect(error.value).toBe('out of memory')
      expect(suggestions.value).toHaveLength(1)
    })

    it('should make the engine probe the device before using it', async () => {
      const { suggest } = useTagSuggestions()

      await suggest('Any text', [tag('sleep')], [])

      expect(initialize).toHaveBeenCalled()
    })
  })

  it('should rank tags differing only in case together, not word-match the second', async () => {
    const { suggest, suggestions } = useTagSuggestions()

    await suggest('Any text', [tag('sleep'), tag('Sleep')], [])

    expect(suggestions.value.map((s) => s.name).sort()).toEqual([
      'Sleep',
      'sleep'
    ])
  })

  it('should tell the person when the model is still downloading', async () => {
    engineState.value = 'downloading'
    installState.value = { hasAnyFiles: true, isInstalled: false }
    const { error, suggest } = useTagSuggestions()

    await suggest('Any text', [tag('sleep')], [])

    expect(error.value).toContain('still downloading')
  })

  it('should discard a run that was cleared while it was in flight', async () => {
    let release: (vector: number[]) => void = () => undefined
    embed.mockImplementation(
      () =>
        new Promise<number[]>((resolve) => {
          release = resolve
        })
    )
    const { clear, isWorking, suggest, suggestions } = useTagSuggestions()

    const run = suggest('Any text', [tag('sleep')], [])
    await vi.waitFor(() => {
      expect(embed).toHaveBeenCalled()
    })
    clear()
    release(fixtureEntry.vector)
    await run

    expect(suggestions.value).toEqual([])
    expect(isWorking.value).toBe(false)
  })

  it('should keep the newer result when an older run finishes last', async () => {
    const releases: ((vector: number[]) => void)[] = []
    embed.mockImplementation(
      () =>
        new Promise<number[]>((resolve) => {
          releases.push(resolve)
        })
    )
    const { suggest, suggestions } = useTagSuggestions()

    const first = suggest('One', [tag('sleep')], [])
    await vi.waitFor(() => {
      expect(releases).toHaveLength(1)
    })
    const second = suggest('Two', [tag('yoga')], [])
    await vi.waitFor(() => {
      expect(releases).toHaveLength(2)
    })
    releases[1]?.(fixtureEntry.vector)
    await second
    releases[0]?.(fixtureEntry.vector)
    await first

    expect(suggestions.value.map((s) => s.name)).toEqual(['yoga'])
  })

  it('should suggest nothing when the vocabulary is empty', async () => {
    const { suggest, suggestions } = useTagSuggestions()

    await suggest('A long day of work', [], [])

    expect(suggestions.value).toEqual([])
  })

  it('should drop its suggestions when cleared', async () => {
    const { clear, suggest, suggestions } = useTagSuggestions()
    await suggest('A long day of work', [tag('work')], [])

    clear()

    expect(suggestions.value).toEqual([])
  })

  it('should not be working once it has finished', async () => {
    const { isWorking, suggest } = useTagSuggestions()

    await suggest('A long day of work', [tag('work')], [])

    expect(isWorking.value).toBe(false)
  })
})
