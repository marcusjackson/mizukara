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

import { useEntrySectionHandlers } from '../composables/use-entry-day-view-section-handlers'

import EntryDayViewCreateForm from './EntryDayViewCreateForm.vue'
import EntryDayViewEntryCard from './EntryDayViewEntryCard.vue'
import EntryDayViewEntryEditor from './EntryDayViewEntryEditor.vue'

import type { Entry } from '@/shared/types/entry-types'

interface Props {
  /** Items to display */
  items: Entry[]
  /** Current date (for default assigned day in create form) */
  currentDate: string
  /** Callback to refetch entries after mutations */
  onRefetch: () => Promise<void>
}

const props = defineProps<Props>()

// Template refs
const createFormRef = ref<InstanceType<typeof EntryDayViewCreateForm> | null>(
  null
)
const currentEditorRef = ref<InstanceType<
  typeof EntryDayViewEntryEditor
> | null>(null)

// Mode state
type ListMode = 'view' | 'reorder'
const currentMode = ref<ListMode>('view')

// Edit mode state
const editingItemId = ref<string | null>(null)

// Handlers composable
const {
  canMoveDown,
  canMoveUp,
  handleEntryCreated,
  handleMoveDown,
  handleMoveUp,
  handleSaveRequested: handleSaveRequestedBase,
  isReordering
} = useEntrySectionHandlers({
  onRefetch: props.onRefetch
})

// Computed
const hasMultipleEntries = computed(() => props.items.length >= 2)
const isReorderMode = computed(() => currentMode.value === 'reorder')
const isAnyEntryEditing = computed(() => editingItemId.value !== null)

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
    currentEditorRef.value?.save()
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
    currentEditorRef.value?.cancel()
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

    <!-- Reorder mode toggle (only show when multiple entries exist) -->
    <div
      v-if="hasMultipleEntries"
      class="reorder-controls"
    >
      <button
        :aria-label="isReorderMode ? 'Done reordering' : 'Reorder entries'"
        class="reorder-toggle-button"
        type="button"
        @click="
          () => {
            currentMode = currentMode === 'view' ? 'reorder' : 'view'
            editingItemId = null
          }
        "
      >
        {{ isReorderMode ? 'Done' : 'Reorder' }}
      </button>
    </div>

    <!-- Empty state when no entries -->
    <div
      v-if="items.length === 0"
      class="empty-state"
      data-testid="empty-state"
    >
      No entries yet. Start writing to capture this day's memories.
    </div>

    <!-- Entry list -->
    <div
      v-else
      class="entry-list"
      data-testid="entry-list"
    >
      <template
        v-for="(item, index) in items"
        :key="item.id"
      >
        <!-- Edit mode: show editor (only in view mode, not reorder mode) -->
        <EntryDayViewEntryEditor
          v-if="!isReorderMode && editingItemId === item.id"
          ref="currentEditorRef"
          :entry="item"
          @edit-cancelled="editingItemId = null"
          @save-requested="(data) => handleSaveRequested(item.id, data)"
        />

        <!-- View/Reorder mode: show card with appropriate controls -->
        <div
          v-else
          class="entry-item"
        >
          <!-- Reorder buttons (only in reorder mode) -->
          <div
            v-if="isReorderMode"
            class="reorder-buttons"
          >
            <button
              :aria-label="`Move up entry ${index + 1}`"
              class="reorder-button reorder-button-up"
              :disabled="!canMoveUp(item.id, items) || isReordering"
              type="button"
              @click="handleMoveUp(item.id, items)"
            >
              ↑
            </button>
            <button
              :aria-label="`Move down entry ${index + 1}`"
              class="reorder-button reorder-button-down"
              :disabled="!canMoveDown(item.id, items) || isReordering"
              type="button"
              @click="handleMoveDown(item.id, items)"
            >
              ↓
            </button>
          </div>

          <!-- Entry card -->
          <EntryDayViewEntryCard
            :entry="item"
            :is-edit-disabled="isAnyEntryEditing"
            :show-edit-button="!isReorderMode"
            @edit-requested="editingItemId = $event"
          />
        </div>
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

.reorder-controls {
  display: flex;
  justify-content: flex-end;
}

.reorder-toggle-button {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 150ms ease;
}

.reorder-toggle-button:hover {
  background-color: var(--color-primary);
  color: var(--color-surface);
}

.reorder-toggle-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
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

.entry-item {
  display: flex;
  align-items: stretch;
  gap: var(--spacing-3);
}

.reorder-buttons {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: var(--spacing-1);
}

.reorder-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  cursor: pointer;
  transition: all 150ms ease;
}

.reorder-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-surface-hover);
  color: var(--color-primary);
}

.reorder-button:disabled {
  color: var(--color-text-disabled);
  opacity: 0.5;
  cursor: not-allowed;
}

.reorder-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
