<script setup lang="ts">
/**
 * EntryDayViewSectionReorder
 *
 * Reorder mode UI for the entry list section.
 * Renders the Done/Reorder toggle button and, when active, the list of
 * entries with up/down move controls. Entry cards are rendered via
 * EntryDayViewEntryCard.
 *
 * @emits toggle-reorder   - User toggled reorder mode on or off
 * @emits move-up          - User requested to move an entry up
 * @emits move-down        - User requested to move an entry down
 */

import SharedEntryCard from '@/shared/components/SharedEntryCard.vue'

import type { Entry } from '@/shared/types/entry-types'
import type { Tag } from '@/shared/types/tag-types'

// =============================================================================
// Props & Emits
// =============================================================================

const props = defineProps<{
  /** All entries in the current day */
  items: Entry[]
  /** Whether reorder mode is currently active */
  isReorderMode: boolean
  /** Whether a reorder operation is in progress */
  isReordering: boolean
  /** Map of entry ID → tags for rendering chips on cards */
  entryTagsMap?: Map<string, Tag[]>
}>()

const emit = defineEmits<{
  'toggle-reorder': []
  'move-up': [entryId: string]
  'move-down': [entryId: string]
}>()

// =============================================================================
// Move helpers
// =============================================================================

function canMoveUp(id: string): boolean {
  return props.items.findIndex((item) => item.id === id) > 0
}

function canMoveDown(id: string): boolean {
  const idx = props.items.findIndex((item) => item.id === id)
  return idx >= 0 && idx < props.items.length - 1
}
</script>

<template>
  <!-- Reorder toggle (shown when 2+ items exist) -->
  <div class="reorder-controls">
    <button
      :aria-label="isReorderMode ? 'Done reordering' : 'Reorder entries'"
      class="reorder-toggle-button"
      type="button"
      @click="emit('toggle-reorder')"
    >
      {{ isReorderMode ? 'Done' : 'Reorder' }}
    </button>
  </div>

  <!-- Entry list in reorder mode -->
  <div
    v-if="isReorderMode"
    class="entry-list"
    data-testid="entry-list"
  >
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="entry-item"
    >
      <div class="reorder-buttons">
        <button
          :aria-label="`Move up entry ${index + 1}`"
          class="reorder-button reorder-button-up"
          :disabled="!canMoveUp(item.id) || isReordering"
          type="button"
          @click="emit('move-up', item.id)"
        >
          ↑
        </button>
        <button
          :aria-label="`Move down entry ${index + 1}`"
          class="reorder-button reorder-button-down"
          :disabled="!canMoveDown(item.id) || isReordering"
          type="button"
          @click="emit('move-down', item.id)"
        >
          ↓
        </button>
      </div>

      <SharedEntryCard
        :entry="item"
        is-edit-disabled
        :show-edit-button="false"
        :tags="entryTagsMap?.get(item.id) ?? []"
      />
    </div>
  </div>
</template>

<style scoped>
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
