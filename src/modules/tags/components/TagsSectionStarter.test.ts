import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import catalog from '@/modules/local-inference/tag-catalog.json'

import TagsSectionStarter from './TagsSectionStarter.vue'

import type { Tag, TagWithCount } from '@/shared/types/tag-types'

const createTag = vi.fn<(name: string) => Promise<Tag | null>>()

vi.mock('../composables/use-tag-mutations', () => ({
  useTagMutations: () => ({ createTag: (name: string) => createTag(name) })
}))
vi.mock('@/shared/composables/use-toast', () => ({
  useToast: () => ({ success: vi.fn() })
}))

const firstGroup = Object.entries(catalog)[0]!

function mountStarter(tags: TagWithCount[] = []) {
  return mount(TagsSectionStarter, { props: { tags } })
}

async function open(wrapper: ReturnType<typeof mountStarter>) {
  await wrapper.find('button').trigger('click')
}

describe('TagsSectionStarter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createTag.mockImplementation((name) =>
      Promise.resolve({ id: name } as unknown as Tag)
    )
  })

  it('should show nothing but the toggle until opened', () => {
    const wrapper = mountStarter()

    expect(wrapper.text()).toContain('Add starter tags')
    expect(wrapper.text()).not.toContain(firstGroup[0])
  })

  it('should list every group once opened', async () => {
    const wrapper = mountStarter()

    await open(wrapper)

    for (const title of Object.keys(catalog)) {
      expect(wrapper.text()).toContain(title)
    }
  })

  it('should add one tag and ask for the list to reload', async () => {
    const wrapper = mountStarter()
    await open(wrapper)

    const chip = wrapper
      .findAll('button')
      .find((b) => b.text() === `Add ${firstGroup[1][0] ?? ''}`)
    await chip?.trigger('click')
    await flushPromises()

    expect(createTag).toHaveBeenCalledWith(firstGroup[1][0])
    expect(wrapper.emitted('tags-added')).toHaveLength(1)
  })

  it('should add a whole group at once', async () => {
    const wrapper = mountStarter()
    await open(wrapper)

    const groupButton = wrapper
      .findAll('button')
      .find(
        (b) =>
          b.attributes('aria-label') ===
          `Add ${String(firstGroup[1].length)} ${firstGroup[0]} tags`
      )
    await groupButton?.trigger('click')
    await flushPromises()

    expect(createTag).toHaveBeenCalledTimes(firstGroup[1].length)
  })

  it('should add every starter tag at once', async () => {
    const wrapper = mountStarter()
    await open(wrapper)
    const total = Object.values(catalog).flat().length

    await wrapper
      .findAll('button')
      .find((b) => b.text() === `Add all ${String(total)} starter tags`)
      ?.trigger('click')
    await flushPromises()

    expect(createTag).toHaveBeenCalledTimes(total)
    expect(wrapper.emitted('tags-added')).toHaveLength(1)
  })

  it('should show the add-all button as done when every tag exists', async () => {
    const all = Object.values(catalog)
      .flat()
      .map((name) => ({ id: name, name }) as unknown as TagWithCount)
    const wrapper = mountStarter(all)
    await open(wrapper)

    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'All starter tags added')
    expect(button?.attributes('disabled')).toBeDefined()
  })

  it('should show a tag the person already has as added, not as a button', async () => {
    const name = firstGroup[1][0]!
    const wrapper = mountStarter([
      {
        createdAt: 1,
        entryCount: 0,
        id: 'x',
        isDeleted: false,
        name,
        updatedAt: 1
      }
    ])
    await open(wrapper)

    expect(wrapper.text()).not.toContain(`Add ${name}`)
    expect(wrapper.text()).toContain(`${name} (added)`)
  })

  it('should not create anything when an added tag is clicked', async () => {
    const name = firstGroup[1][0]!
    const wrapper = mountStarter([
      {
        createdAt: 1,
        entryCount: 0,
        id: 'x',
        isDeleted: false,
        name,
        updatedAt: 1
      }
    ])
    await open(wrapper)

    const chip = wrapper
      .findAll('button')
      .find((b) => b.text() === `${name} (added)`)
    await chip?.trigger('click')

    expect(createTag).not.toHaveBeenCalled()
    expect(chip?.attributes('aria-disabled')).toBe('true')
  })

  it('should not ask for a reload when nothing was created', async () => {
    createTag.mockResolvedValue(null)
    const wrapper = mountStarter()
    await open(wrapper)

    const chip = wrapper
      .findAll('button')
      .find((b) => b.text().startsWith('Add '))
    await chip?.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('tags-added')).toBeUndefined()
  })

  it('should expose the open state and what it controls on the toggle', async () => {
    const wrapper = mountStarter()
    const toggle = wrapper.find('button')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(
      wrapper.find(`#${toggle.attributes('aria-controls') ?? 'none'}`).exists()
    ).toBe(true)
  })
})
