/**
 * Tests for EntryDayViewEntryEditorTags component
 *
 * Validates mount-time tag loading, selection diff mutations, and
 * inline tag creation via createAndAssignTag.
 */

import { ref } from 'vue'

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EntryDayViewEntryEditorTags from './EntryDayViewEntryEditorTags.vue'

import type { Tag, TagInputOption } from '@/shared/types/tag-types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAssignTag = vi.fn().mockResolvedValue(undefined)
const mockRemoveTag = vi.fn().mockResolvedValue(undefined)
const mockCreateAndAssignTag = vi.fn()

vi.mock('@/modules/tags/composables/use-entry-tag-mutations', () => ({
  useEntryTagMutations: () => ({
    assignTag: mockAssignTag,
    removeTag: mockRemoveTag,
    createAndAssignTag: mockCreateAndAssignTag
  })
}))

const mockFindByEntryId = vi.hoisted(() =>
  vi.fn<(db: unknown, id: unknown) => Tag[]>().mockReturnValue([])
)

vi.mock('@/api/entry-tags/entry-tag-queries', () => ({
  findByEntryId: mockFindByEntryId
}))

const mockDb = ref<object | null>({ name: 'mock-db' })

vi.mock('@/shared/composables/use-database', () => ({
  useDatabase: () => ({ database: mockDb })
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const allTags: TagInputOption[] = [
  { value: 'tag-1', label: 'work' },
  { value: 'tag-2', label: 'personal' },
  { value: 'tag-3', label: 'health' }
]

/**
 * Stub for BaseTagInput that exposes buttons to trigger events.
 * Using button-click triggers avoids unsafe vm.$emit access on typed wrappers.
 * Payload values correspond to the test tag IDs: tag-1, tag-2.
 */
const baseTagInputStub = {
  name: 'BaseTagInput',
  template: `
    <div data-testid="base-tag-input">
      <button data-testid="emit-add-tag2" @click="$emit('update:modelValue', ['tag-1', 'tag-2'])" />
      <button data-testid="emit-remove-tag2" @click="$emit('update:modelValue', ['tag-1'])" />
      <button data-testid="emit-create" @click="$emit('create-tag', 'newlabel')" />
    </div>
  `,
  props: ['options', 'label', 'placeholder', 'modelValue'],
  emits: ['update:modelValue', 'create-tag']
}

function mountComponent(
  props?: Partial<{ entryId: string; allTags: TagInputOption[] }>
) {
  return mount(EntryDayViewEntryEditorTags, {
    props: {
      entryId: 'entry-id-1',
      allTags,
      ...props
    },
    global: {
      stubs: { BaseTagInput: baseTagInputStub }
    }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EntryDayViewEntryEditorTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.value = { name: 'mock-db' }
    mockFindByEntryId.mockReturnValue([])
    mockCreateAndAssignTag.mockResolvedValue(null)
  })

  it('renders BaseTagInput', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="base-tag-input"]').exists()).toBe(true)
  })

  it('loads current tags on mount', async () => {
    mockFindByEntryId.mockReturnValue([
      {
        id: 'tag-1',
        name: 'work',
        createdAt: 0,
        updatedAt: 0,
        isDeleted: false
      }
    ])

    mountComponent({ entryId: 'entry-id-1' })
    await flushPromises()

    expect(mockFindByEntryId).toHaveBeenCalledWith(mockDb.value, 'entry-id-1')
  })

  it('calls assignTag for newly added tags', async () => {
    mockFindByEntryId.mockReturnValue([
      {
        id: 'tag-1',
        name: 'work',
        createdAt: 0,
        updatedAt: 0,
        isDeleted: false
      }
    ])

    const wrapper = mountComponent({ entryId: 'entry-id-1' })
    await flushPromises()

    await wrapper.find('[data-testid="emit-add-tag2"]').trigger('click')
    await flushPromises()

    expect(mockAssignTag).toHaveBeenCalledWith('entry-id-1', 'tag-2')
    expect(mockRemoveTag).not.toHaveBeenCalled()
  })

  it('calls removeTag for deselected tags', async () => {
    mockFindByEntryId.mockReturnValue([
      {
        id: 'tag-1',
        name: 'work',
        createdAt: 0,
        updatedAt: 0,
        isDeleted: false
      },
      {
        id: 'tag-2',
        name: 'personal',
        createdAt: 0,
        updatedAt: 0,
        isDeleted: false
      }
    ])

    const wrapper = mountComponent({ entryId: 'entry-id-1' })
    await flushPromises()

    await wrapper.find('[data-testid="emit-remove-tag2"]').trigger('click')
    await flushPromises()

    expect(mockRemoveTag).toHaveBeenCalledWith('entry-id-1', 'tag-2')
    expect(mockAssignTag).not.toHaveBeenCalled()
  })

  it('calls createAndAssignTag on create-tag emit', async () => {
    const newTag = {
      id: 'tag-new',
      name: 'newlabel',
      createdAt: 0,
      updatedAt: 0,
      isDeleted: false
    }
    mockCreateAndAssignTag.mockResolvedValue(newTag)

    const wrapper = mountComponent({ entryId: 'entry-id-1' })
    await flushPromises()

    await wrapper.find('[data-testid="emit-create"]').trigger('click')
    await flushPromises()

    expect(mockCreateAndAssignTag).toHaveBeenCalledWith(
      'entry-id-1',
      'newlabel'
    )
  })

  it('adds new tag id to selectedTagIds after successful creation', async () => {
    const newTag = {
      id: 'tag-new',
      name: 'newlabel',
      createdAt: 0,
      updatedAt: 0,
      isDeleted: false
    }
    mockCreateAndAssignTag.mockResolvedValue(newTag)

    const wrapper = mountComponent({ entryId: 'entry-id-1' })
    await flushPromises()

    await wrapper.find('[data-testid="emit-create"]').trigger('click')
    await flushPromises()

    const tagInput = wrapper.findComponent({ name: 'BaseTagInput' })
    expect(tagInput.props('modelValue')).toContain('tag-new')
  })

  it('adds newly created tag to options so chip renders immediately', async () => {
    const newTag = {
      id: 'tag-new',
      name: 'newlabel',
      createdAt: 0,
      updatedAt: 0,
      isDeleted: false
    }
    mockCreateAndAssignTag.mockResolvedValue(newTag)

    const wrapper = mountComponent({ entryId: 'entry-id-1' })
    await flushPromises()

    await wrapper.find('[data-testid="emit-create"]').trigger('click')
    await flushPromises()

    const tagInput = wrapper.findComponent({ name: 'BaseTagInput' })
    const options = tagInput.props('options') as {
      value: string
      label: string
    }[]
    expect(
      options.some((o) => o.value === 'tag-new' && o.label === 'newlabel')
    ).toBe(true)
  })

  it('does not add chip when createAndAssignTag returns null', async () => {
    mockCreateAndAssignTag.mockResolvedValue(null)

    const wrapper = mountComponent({ entryId: 'entry-id-1' })
    await flushPromises()

    await wrapper.find('[data-testid="emit-create"]').trigger('click')
    await flushPromises()

    // selectedTagIds should remain empty
    const tagInput = wrapper.findComponent({ name: 'BaseTagInput' })
    expect(tagInput.props('modelValue')).toEqual([])
  })

  it('skips load when database is not initialized', () => {
    mockDb.value = null

    mountComponent()

    expect(mockFindByEntryId).not.toHaveBeenCalled()
  })
})
