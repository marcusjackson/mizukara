<script setup lang="ts">
/**
 * BaseTagInputChips
 *
 * Renders the selected-tag chip strip above the combobox input.
 * Each chip has a remove button with a screen-reader label.
 *
 * @emits remove-chip - User clicked the remove button on a chip; passes tag ID
 */

import type { TagInputOption } from '@/shared/types/tag-types'

const props = defineProps<{
  /** Currently selected tag options to render as chips */
  selectedOptions: TagInputOption[]
  /** Whether the input is disabled (disables chip remove buttons) */
  disabled?: boolean
}>()

const emit = defineEmits<{
  'remove-chip': [value: string]
}>()
</script>

<template>
  <div
    class="base-tag-input-chips"
    data-testid="tag-chips"
  >
    <button
      v-for="option in props.selectedOptions"
      :key="option.value"
      class="base-tag-input-chip"
      :disabled="props.disabled"
      type="button"
      @click="emit('remove-chip', option.value)"
    >
      <span class="base-tag-input-chip-text">{{ option.label }}</span>
      <svg
        aria-hidden="true"
        class="base-tag-input-chip-remove"
        fill="none"
        height="14"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        width="14"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
      <span class="sr-only">Remove {{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
/* Chips container */
.base-tag-input-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

/* Individual chip */
.base-tag-input-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface-raised);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.base-tag-input-chip:hover:not(:disabled) {
  border-color: var(--color-error);
  background-color: var(--color-error-subtle);
}

.base-tag-input-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-tag-input-chip-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-tag-input-chip-remove {
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.base-tag-input-chip:hover:not(:disabled) .base-tag-input-chip-remove {
  color: var(--color-error);
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  border: 0;
  white-space: nowrap;
}
</style>
