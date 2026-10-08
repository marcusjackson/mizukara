import { ref } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import head from '../tag-head.json'
import evalFixture from '../tag-head-eval-fixture.json'
import reference from '../tag-reference.json'
import { rankTags } from '../utils/tag-head-scoring'

import { rankWithModel } from './use-tag-model-ranking'

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

const entryVector = evalFixture[0]!.vector
const TOP_TAG = rankTags(head, entryVector)[0]?.tag ?? ''
const tag = (label: string): TagInputOption => ({
  label,
  value: `tag-${label}`
})
const linked = new Map([[TOP_TAG, [tag(TOP_TAG)]]])

describe('rankWithModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    engineState.value = 'idle'
    engineError.value = null
    installState.value = { hasAnyFiles: true, isInstalled: true }
    initialize.mockResolvedValue(undefined)
    embed.mockResolvedValue(entryVector)
  })

  it('should rank a catalog-named and a custom tag in one list', async () => {
    const { notice, ranked } = await rankWithModel(
      { head, reference },
      'text',
      linked,
      [tag('ranking-custom')]
    )

    expect(notice).toBeNull()
    expect(ranked.map((s) => s.name).sort()).toEqual(
      [TOP_TAG, 'ranking-custom'].sort()
    )
  })

  it('should give a notice and no tags while the model downloads', async () => {
    engineState.value = 'downloading'

    const { notice, ranked } = await rankWithModel(
      { head, reference },
      'text',
      linked,
      []
    )

    expect(notice).toContain('downloading')
    expect(ranked).toEqual([])
    expect(embed).not.toHaveBeenCalled()
  })

  it('should surface the engine error when the entry cannot be embedded', async () => {
    embed.mockResolvedValue(null)
    engineError.value = 'out of memory'

    const { notice } = await rankWithModel(
      { head, reference },
      'text',
      linked,
      []
    )

    expect(notice).toBe('out of memory')
  })
})
