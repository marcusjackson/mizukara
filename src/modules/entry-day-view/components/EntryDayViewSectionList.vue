<script setup lang="ts">
/**
 * EntryDayViewSectionList
 *
 * Section component for managing entry list display and interactions.
 * Handles view mode, edit mode, reorder mode, and coordinates create/update operations.
 *
 * Features:
 * - Create form always visible at top
 * - View mode: displays entry cards with edit buttons
 * - Edit mode: replaces card with editor (single-editor mode)
 * - Reorder mode: shows move up/down buttons for reordering entries
 * - Empty state when no entries
 *
 * Exposed Methods:
 * - focusCreateForm() - Programmatically focus the create form textarea.
 *   Used by parent Root component for keyboard shortcuts (Cmd/Ctrl+N).
 *
 * Example:
 *   const listRef = ref()
 *   listRef.value?.focusCreateForm()
 */

import { computed, ref } from 'vue'

import SharedEntryCard from '@/shared/components/SharedEntryCard.vue'

import { useEntrySectionHandlers } from '../composables/use-entry-day-view-section-handlers'

import EntryDayViewCreateForm from './EntryDayViewCreateForm.vue'
import EntryDayViewEntryEditor from './EntryDayViewEntryEditor.vue'
import EntryDayViewSectionReorder from './EntryDayViewSectionReorder.vue'

import type { Entry } from '@/shared/types/entry-types'
import type { Tag, TagInputOption } from '@/shared/types/tag-types'

interface Props {
  /** Items to display */
  items: Entry[]
  /** Current date (for default assigned day in create form) */
  currentDate: string
  /** Callback to refetch entries after mutations */
  onRefetch: () => Promise<void>
  /** All available tag options; passed to editor for inline tag assignment */
  allTags?: TagInputOption[]
  /** Map of entry ID → tags; used to render chips on each card */
  entryTagsMap?: Map<string, Tag[]>
}

const props = defineProps<Props>()

// Template refs
const createFormRef = ref<InstanceType<typeof EntryDayViewCreateForm> | null>(
  null
)
const currentEditorRef = ref<InstanceType<typeof EntryDayViewEntryEditor>[]>([])

// Mode state
type ListMode = 'view' | 'reorder'
const currentMode = ref<ListMode>('view')

// Edit mode state
const editingItemId = ref<string | null>(null)

// Handlers composable
const {
  handleEntryCreated,
  handleMoveDown,
  handleMoveUp,
  handleSaveRequested: handleSaveRequestedBase,
  isReordering
} = useEntrySectionHandlers({
  onRefetch: props.onRefetch
})

// Computed
const isReorderMode = computed(() => currentMode.value === 'reorder')

const handleReorderToggle = () => {
  currentMode.value = currentMode.value === 'view' ? 'reorder' : 'view'
  editingItemId.value = null
}

const handleSaveRequested = async (
  entryId: string,
  data: { content: string; assignedDay: string }
): Promise<void> => {
  await handleSaveRequestedBase(entryId, data)
  editingItemId.value = null
}

/**
 * Focus the create form textarea
 *
 * Exposed for parent component keyboard shortcuts (Cmd/Ctrl+K).
 * Safe to call at any time - no side effects if form is not rendered.
 */
const focusCreateForm = () => {
  createFormRef.value?.focus()
}

/**
 * Execute context-aware save action
 *
 * Delegates to the active editor if an entry is being edited,
 * otherwise submits the create form. Exposed for parent component
 * keyboard shortcuts (Cmd/Ctrl+S).
 *
 * Behavior:
 * - If editing an entry: Calls save() on the EntryDayViewEntryEditor
 * - If creating new entry: Calls submit() on EntryDayViewCreateForm
 * - If neither: No-op
 */
const handleGlobalSave = () => {
  if (editingItemId.value === null) {
    createFormRef.value?.submit()
  } else {
    currentEditorRef.value[0]?.save()
  }
}

/**
 * Execute context-aware escape action
 *
 * Cancels the active edit or clears the create form. Exposed for
 * parent component keyboard shortcuts (Escape).
 *
 * Behavior:
 * - If editing an entry: Cancels edit and returns to view mode
 * - If creating new entry: Clears the create form content
 * - If neither: No-op
 */
const handleGlobalEscape = () => {
  if (editingItemId.value === null) {
    createFormRef.value?.clear()
  } else {
    currentEditorRef.value[0]?.cancel()
  }
}

defineExpose({ focusCreateForm, handleGlobalSave, handleGlobalEscape })
</script>

<template>
  <section
    aria-label="Entry list"
    class="entry-day-view-section-list"
  >
    <!-- Create form always visible at top -->
    <EntryDayViewCreateForm
      ref="createFormRef"
      :default-assigned-day="currentDate"
      @entry-created="handleEntryCreated"
    />

    <!-- Reorder controls and reorder mode list -->
    <EntryDayViewSectionReorder
      v-if="items.length >= 2"
      v-bind="entryTagsMap ? { entryTagsMap } : {}"
      :is-reorder-mode="isReorderMode"
      :is-reordering="isReordering"
      :items="items"
      @move-down="(id) => handleMoveDown(id, items)"
      @move-up="(id) => handleMoveUp(id, items)"
      @toggle-reorder="handleReorderToggle"
    />

    <!-- Empty state when no entries -->
    <div
      v-if="items.length === 0"
      class="empty-state"
      data-testid="empty-state"
    >
      No entries yet. Start writing to capture this day's memories.
    </div>

    <!-- Entry list (view/edit mode) -->
    <div
      v-else-if="!isReorderMode"
      class="entry-list"
      data-testid="entry-list"
    >
      <template
        v-for="item in items"
        :key="item.id"
      >
        <!-- Edit mode: show editor -->
        <EntryDayViewEntryEditor
          v-if="editingItemId === item.id"
          ref="currentEditorRef"
          :all-tags="allTags ?? []"
          :entry="item"
          @edit-cancelled="editingItemId = null"
          @save-requested="(data) => handleSaveRequested(item.id, data)"
        />

        <!-- View mode: show card -->
        <SharedEntryCard
          v-else
          :entry="item"
          :is-edit-disabled="editingItemId !== null"
          show-edit-button
          :tags="entryTagsMap?.get(item.id) ?? []"
          @edit-requested="editingItemId = $event"
        />
      </template>
    </div>
  </section>
</template>

<style scoped>
.entry-day-view-section-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
  padding: var(--spacing-5);
}

@media (width <= 767px) {
  .entry-day-view-section-list {
    gap: var(--spacing-4);
    padding: var(--spacing-4);
  }
}

.empty-state {
  padding: var(--spacing-8) var(--spacing-4);
  color: var(--color-text-muted);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  text-align: center;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}
</style>
