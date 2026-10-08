<script setup lang="ts">
/**
 * EntryDayViewEntryEditorTags
 *
 * Tag input area for the entry editor.
 * Extracted from EntryDayViewEntryEditor to keep the editor within its line budget.
 *
 * Fetches the entry's current tags on mount, then handles each add/remove
 * as an immediate mutation — no editor save cycle required.
 *
 * @prop entryId - ID of the entry being edited
 * @prop allTags - All available tag options (from use-tags at section level)
 * @prop entryText - Live editor content, so suggestions reflect unsaved edits
 */

import { computed, onMounted, ref } from 'vue'

import BaseTagInput from '@/base/components/BaseTagInput.vue'

import { findByEntryId } from '@/api/entry-tags/entry-tag-queries'

import { useDatabase } from '@/shared/composables/use-database'

import { useEntryTagMutations } from '@/modules/tags/composables/use-entry-tag-mutations'

import EntryDayViewEntryEditorTagSuggestions from './EntryDayViewEntryEditorTagSuggestions.vue'

import type { TagInputOption } from '@/shared/types/tag-types'

interface Props {
  /** ID of the entry whose tags are being managed */
  entryId: string
  /** All available tag options for the combobox; provided from section level */
  allTags: TagInputOption[]
  /** Live editor content, so suggestions reflect edits not yet saved */
  entryText: string
}

const props = defineProps<Props>()

const { database } = useDatabase()
const { assignTag, createAndAssignTag, removeTag } = useEntryTagMutations()

// Current selection — array of tag IDs
const selectedTagIds = ref<string[]>([])

/**
 * Tags created inline during this editing session.
 * Merged with allTags so chips render immediately without waiting
 * for the parent to refetch the tag list.
 */
const newlyCreatedTags = ref<TagInputOption[]>([])

const effectiveOptions = computed(() => [
  ...props.allTags,
  ...newlyCreatedTags.value
])

/**
 * Load the entry's current tags from the database.
 */
function loadCurrentTags(): void {
  if (!database.value) return
  const tags = findByEntryId(database.value, props.entryId)
  selectedTagIds.value = tags.map((t) => t.id)
}

/**
 * Every change to the selection runs through this queue, one at a time. Each
 * diffs against the selection as the one before it left it, so overlapping
 * changes cannot diff against stale state and lose a removal.
 */
let changeQueue: Promise<void> = Promise.resolve()

function enqueue(task: () => Promise<void>): Promise<void> {
  changeQueue = changeQueue.then(task)
  return changeQueue
}

/**
 * Diff old vs new selection and apply add/remove mutations immediately.
 */
function handleSelectionChange(newIds: string[]): Promise<void> {
  return enqueue(() => applySelection(newIds))
}

async function applySelection(newIds: string[]): Promise<void> {
  const prev = selectedTagIds.value
  const added = newIds.filter((id) => !prev.includes(id))
  const removed = prev.filter((id) => !newIds.includes(id))

  for (const tagId of added) {
    await assignTag(props.entryId, tagId)
  }
  for (const tagId of removed) {
    await removeTag(props.entryId, tagId)
  }

  selectedTagIds.value = newIds
}

/**
 * Inline creation: create the tag then assign it to the entry.
 */
function handleCreateTag(name: string): Promise<void> {
  return enqueue(async () => {
    const tag = await createAndAssignTag(props.entryId, name)
    if (tag) {
      newlyCreatedTags.value = [
        ...newlyCreatedTags.value,
        { value: tag.id, label: tag.name }
      ]
      selectedTagIds.value = [...selectedTagIds.value, tag.id]
    }
  })
}

/**
 * Apply a suggested existing tag.
 *
 * Routed through the same selection change a manual add makes, rather than
 * calling assignTag directly — the chips render from `selectedTagIds`, so a
 * direct write would reach the database and leave the editor unchanged.
 */
function handleApplyExisting(tagId: string): Promise<void> {
  return enqueue(async () => {
    if (selectedTagIds.value.includes(tagId)) return
    await applySelection([...selectedTagIds.value, tagId])
  })
}

onMounted(() => {
  loadCurrentTags()
})
</script>

<template>
  <div class="entry-editor-tags">
    <BaseTagInput
      label="Tags"
      :model-value="selectedTagIds"
      :options="effectiveOptions"
      placeholder="Add tags…"
      @create-tag="handleCreateTag"
      @update:model-value="handleSelectionChange"
    />
    <EntryDayViewEntryEditorTagSuggestions
      :assigned-tag-ids="selectedTagIds"
      :entry-text="entryText"
      :vocabulary="effectiveOptions"
      @apply-existing="handleApplyExisting"
    />
  </div>
</template>

<style scoped>
.entry-editor-tags {
  display: flex;
  flex-direction: column;
}
</style>
