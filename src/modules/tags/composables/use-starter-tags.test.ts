import { beforeEach, describe, expect, it, vi } from 'vitest'

import catalog from '@/modules/local-inference/tag-catalog.json'

import { useStarterTags } from './use-starter-tags'

import type { Tag, TagWithCount } from '@/shared/types/tag-types'

const createTag = vi.fn<(name: string) => Promise<Tag | null>>()
const success = vi.fn()

vi.mock('./use-tag-mutations', () => ({
  useTagMutations: () => ({ createTag: (name: string) => createTag(name) })
}))
vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({ success })
}))

const existing = (name: string): TagWithCount => ({
  createdAt: 1,
  entryCount: 0,
  id: `id-${name}`,
  isDeleted: false,
  name,
  updatedAt: 1
})

const firstGroup = Object.entries(catalog)[0]!

describe('useStarterTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createTag.mockImplementation((name) =>
      Promise.resolve({ id: name } as unknown as Tag)
    )
  })

  it('should list every catalog group', () => {
    const { groups } = useStarterTags(() => [])

    expect(groups.value.map((g) => g.title)).toEqual(Object.keys(catalog))
  })

  it('should mark a tag as added ignoring case', () => {
    const [title, names] = firstGroup
    const { groups } = useStarterTags(() => [existing(names[0]!.toUpperCase())])

    const group = groups.value.find((g) => g.title === title)!
    expect(group.tags[0]?.isAdded).toBe(true)
    expect(group.missing).toHaveLength(names.length - 1)
  })

  it('should create only the tags that do not exist yet', async () => {
    const [, names] = firstGroup
    const { addTags } = useStarterTags(() => [existing(names[0]!)])

    const created = await addTags(names.slice(0, 3))

    expect(created).toBe(2)
    expect(createTag.mock.calls.map((c) => c[0])).toEqual(names.slice(1, 3))
  })

  it('should say how many were added', async () => {
    const { addTags } = useStarterTags(() => [])

    await addTags(['health', 'sleep'])

    expect(success).toHaveBeenCalledWith('Added 2 tags')
  })

  it('should keep going and count only successes when one creation fails', async () => {
    createTag.mockImplementation((name) =>
      Promise.resolve(
        name === 'health' ? null : ({ id: name } as unknown as Tag)
      )
    )
    const { addTags } = useStarterTags(() => [])

    expect(await addTags(['health', 'sleep'])).toBe(1)
    expect(success).toHaveBeenCalledWith('Added 1 tag')
  })

  it('should say nothing when nothing was created', async () => {
    const { addTags } = useStarterTags(() => [existing('health')])

    await addTags(['health'])

    expect(success).not.toHaveBeenCalled()
  })

  it('should ignore a second request while one is running', async () => {
    let release: () => void = () => undefined
    createTag.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => {
            resolve({ id: 'x' } as unknown as Tag)
          }
        })
    )
    const { addTags, isAdding } = useStarterTags(() => [])

    const first = addTags(['health'])
    expect(isAdding.value).toBe(true)
    expect(await addTags(['sleep'])).toBe(0)
    release()
    await first

    expect(createTag).toHaveBeenCalledTimes(1)
    expect(isAdding.value).toBe(false)
  })
})
