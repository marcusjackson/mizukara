<script setup lang="ts">
/**
 * EntryDayViewEntryCard
 *
 * Display card component for a single journal entry.
 * Shows entry content, metadata, and edit button.
 *
 * Features:
 * - Serif font for content (better readability)
 * - Preserves whitespace and line breaks
 * - Shows creation time and edited indicator
 * - Edit button visible on hover (desktop) or always visible (mobile)
 * - Proper text wrapping for long words
 *
 * @emits edit-requested - Emitted when Edit button is clicked, passes entry ID
 *
 * @example
 * ```vue
 * <EntryDayViewEntryCard
 *   :entry="entry"
 *   @edit-requested="handleEditEntry"
 * />
 * ```
 */

import { computed } from 'vue'

import { formatTimestampShort } from '@/shared/utils/date-utils'

import type { Entry } from '@/shared/types/entry-types'

interface Props {
  entry: Entry
  /** Whether the edit button should be disabled (when another entry is being edited) */
  isEditDisabled?: boolean
  /** Whether to show the edit button (hidden in reorder mode) */
  showEditButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditDisabled: false,
  showEditButton: true
})

const emit = defineEmits<{
  'edit-requested': [entryId: string]
}>()

const formattedCreatedAt = computed(() => {
  return formatTimestampShort(props.entry.createdAt)
})

const hasBeenUpdated = computed(() => {
  return props.entry.updatedAt > props.entry.createdAt
})

const handleEditClick = () => {
  emit('edit-requested', props.entry.id)
}
</script>

<template>
  <article
    class="entry-card"
    data-testid="entry-card"
  >
    <div
      class="entry-content"
      data-testid="entry-content"
    >
      {{ entry.content }}
    </div>

    <div class="entry-metadata">
      <time
        class="created-at"
        data-testid="created-at"
      >
        Created: {{ formattedCreatedAt }}
      </time>
      <span
        v-if="hasBeenUpdated"
        class="updated-indicator"
        data-testid="updated-indicator"
      >
        (edited)
      </span>
    </div>

    <button
      v-if="showEditButton"
      :aria-label="`Edit entry from ${formattedCreatedAt}`"
      class="edit-button"
      data-testid="edit-button"
      :disabled="isEditDisabled"
      type="button"
      @click="handleEditClick"
    >
      Edit
    </button>
  </article>
</template>

<style scoped>
.entry-card {
  position: relative;
  padding: var(--spacing-5);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

@media (width <= 767px) {
  .entry-card {
    padding: var(--spacing-4);
  }
}

.entry-content {
  margin-bottom: var(--spacing-3);
  color: var(--color-text-primary);
  font-family: var(--font-family-serif);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

@media (width <= 767px) {
  .entry-content {
    font-size: var(--font-size-base);
  }
}

.entry-metadata {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-text-secondary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
}

.created-at {
  font-weight: var(--font-weight-normal);
}

.updated-indicator {
  font-style: italic;
}

.edit-button {
  position: absolute;
  top: var(--spacing-3);
  right: var(--spacing-3);
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.edit-button:hover {
  background-color: var(--color-primary-hover);
}

.edit-button:focus {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

@media (width <= 767px) {
  .edit-button {
    position: static;
    align-self: flex-end;
    margin-top: var(--spacing-3);
  }
}

@media (width >= 768px) {
  .edit-button {
    opacity: 0;
    pointer-events: none;
  }

  .entry-card:hover .edit-button {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
