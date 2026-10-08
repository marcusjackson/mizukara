import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import EntryDayViewEntryEditorTagSuggestions from './EntryDayViewEntryEditorTagSuggestions.vue'

import type { TagInputOption } from '@/shared/types/tag-types'

vi.mock(
  '@/modules/local-inference/composables/use-local-inference-engine',
  () => ({
    useLocalInferenceEngine: () => ({
      embed: vi.fn(),
      error: { value: null },
      initialize: vi.fn().mockResolvedValue(undefined),
      installState: { value: { hasAnyFiles: false, isInstalled: false } },
      state: { value: 'no-model' }
    })
  })
)

const routerLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const VOCABULARY: TagInputOption[] = [
  { label: 'work', value: 'tag-work' },
  { label: 'family', value: 'tag-family' }
]

function mountSuggestions(entryText = 'A long day of work') {
  return mount(EntryDayViewEntryEditorTagSuggestions, {
    props: { assignedTagIds: [], entryText, vocabulary: VOCABULARY }
  })
}

function suggestButton(
  wrapper: ReturnType<typeof mountSuggestions>
): ReturnType<typeof wrapper.find> {
  return wrapper.find('button')
}

/** Wait out the asynchronous suggestion run, which loads the head lazily. */
async function settle(
  wrapper: ReturnType<typeof mountSuggestions>
): Promise<void> {
  await vi.waitFor(() => {
    expect(wrapper.text()).not.toContain('Suggesting')
  }, 5000)
}

describe('EntryDayViewEntryEditorTagSuggestions', () => {
  it('should offer to suggest tags when the entry has text', () => {
    const wrapper = mountSuggestions()

    expect(suggestButton(wrapper).text()).toBe('Suggest tags')
    expect(suggestButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('should not offer to suggest tags for an empty entry', () => {
    const wrapper = mountSuggestions('   ')

    expect(suggestButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('should show a chip for each suggestion when asked', async () => {
    const wrapper = mountSuggestions()

    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    expect(wrapper.text()).toContain('Add work')
  })

  it('should emit the tag id when an existing-tag chip is clicked', async () => {
    const wrapper = mountSuggestions()
    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    await wrapper.findAll('button')[1]?.trigger('click')

    expect(wrapper.emitted('apply-existing')).toEqual([['tag-work']])
  })

  it('should drop only the applied chip and keep the others', async () => {
    const wrapper = mountSuggestions('Work was hard, family helped')
    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)
    expect(wrapper.text()).toContain('Add work')
    expect(wrapper.text()).toContain('Add family')

    await wrapper.findAll('button')[1]?.trigger('click')
    const applied = wrapper.emitted('apply-existing')?.[0]?.[0] as string
    await wrapper.setProps({ assignedTagIds: [applied] })

    const appliedName = applied === 'tag-work' ? 'work' : 'family'
    const otherName = applied === 'tag-work' ? 'family' : 'work'
    expect(wrapper.text()).not.toContain(`Add ${appliedName}`)
    expect(wrapper.text()).toContain(`Add ${otherName}`)
    expect(wrapper.text()).toContain('1 tag suggested.')
  })

  it('should say all were added once every chip is applied', async () => {
    const wrapper = mountSuggestions('Work was hard, family helped')
    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    await wrapper.setProps({ assignedTagIds: ['tag-work', 'tag-family'] })

    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.text()).toContain('All suggested tags added.')
  })

  it('should announce when there is nothing to suggest', async () => {
    const wrapper = mountSuggestions('Counting pills and feeling dizzy')

    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    expect(wrapper.text()).toContain('No tags to suggest')
  })

  it('should show an empty result on screen, not only to screen readers', async () => {
    const wrapper = mountSuggestions('Counting pills and feeling dizzy')

    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    expect(
      wrapper.find('.entry-editor-tag-suggestions-notice').text()
    ).toContain('No tags to suggest')
  })

  it('should say when there are no tags to suggest from', async () => {
    const wrapper = mount(EntryDayViewEntryEditorTagSuggestions, {
      global: { stubs: { RouterLink: routerLinkStub } },
      props: { assignedTagIds: [], entryText: 'A long day', vocabulary: [] }
    })

    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    expect(wrapper.text()).toContain('you have not created any tags')
    expect(wrapper.find('a').attributes('href')).toBe('/tags')
  })

  it('should not offer starter tags when tags exist', async () => {
    const wrapper = mountSuggestions('Counting pills and feeling dizzy')

    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('should say nothing at all before suggestions have been asked for', () => {
    const wrapper = mountSuggestions()

    expect(wrapper.text()).not.toContain('No tags to suggest')
  })

  it('should count a single suggestion in the singular', async () => {
    const wrapper = mountSuggestions()

    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    expect(wrapper.text()).toContain('1 tag suggested.')
  })

  it('should drop stale suggestions when the entry text changes', async () => {
    const wrapper = mountSuggestions()
    await suggestButton(wrapper).trigger('click')
    await settle(wrapper)

    await wrapper.setProps({ entryText: 'Something else entirely' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Add work')
  })

  it('should say so and point to Settings when the model is not installed', async () => {
    const wrapper = mountSuggestions()

    await suggestButton(wrapper).trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Settings')
    })
  })

  describe('with more than five suggestions', () => {
    const MANY: TagInputOption[] = [
      'alpha',
      'bravo',
      'charlie',
      'delta',
      'echo',
      'foxtrot',
      'golf'
    ].map((label) => ({ label, value: `tag-${label}` }))
    const TEXT = 'alpha bravo charlie delta echo foxtrot golf'

    async function suggestMany() {
      const wrapper = mount(EntryDayViewEntryEditorTagSuggestions, {
        props: { assignedTagIds: [], entryText: TEXT, vocabulary: MANY }
      })
      await wrapper.find('button').trigger('click')
      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Add alpha')
      })
      return wrapper
    }

    it('should show five and offer the rest', async () => {
      const wrapper = await suggestMany()

      expect(wrapper.text()).toContain('Add echo')
      expect(wrapper.text()).not.toContain('Add foxtrot')
      expect(wrapper.text()).toContain('Show 2 more')
    })

    it('should reveal the rest when asked', async () => {
      const wrapper = await suggestMany()

      const more = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Show 2 more'))
      await more?.trigger('click')

      expect(wrapper.text()).toContain('Add golf')
      expect(wrapper.text()).not.toContain('Show')
    })
  })

  it('should not show results for text that changed while suggesting', async () => {
    const wrapper = mountSuggestions()

    await suggestButton(wrapper).trigger('click')
    await wrapper.setProps({ entryText: 'Something else entirely' })
    await settle(wrapper)

    expect(wrapper.text()).not.toContain('Add work')
    expect(wrapper.text()).not.toContain('No tags to suggest')
  })
})
