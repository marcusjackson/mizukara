<script setup lang="ts">
/**
 * BaseTagInputDropdown
 *
 * Renders the combobox dropdown portal for BaseTagInput.
 * Displays filtered tag options and a synthetic "Create '...'" option.
 *
 * Must be used as a descendant of ComboboxRoot.
 * Global (unscoped) styles are required because content is teleported via portal.
 *
 * @emits create-select - User selected the "Create" synthetic option
 */

import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxViewport
} from 'reka-ui'

import type { TagInputOption } from '@/shared/types/tag-types'

const props = defineProps<{
  /** Options filtered by the current search term */
  filteredOptions: TagInputOption[]
  /** Whether to show the "Create '...'" synthetic option */
  showCreateOption: boolean
  /** Current search term (used in the create option label) */
  searchTerm: string
}>()

const emit = defineEmits<{
  'create-select': []
}>()

/** Sentinel value identifying the inline "Create new tag" synthetic option. */
const CREATE_TAG_SENTINEL = '__create_new__' as const
</script>

<template>
  <ComboboxPortal>
    <ComboboxContent
      class="base-tag-input-content"
      position="popper"
      :side-offset="4"
    >
      <ComboboxViewport class="base-tag-input-viewport">
        <ComboboxEmpty class="base-tag-input-empty">
          No results found
        </ComboboxEmpty>

        <ComboboxItem
          v-for="option in props.filteredOptions"
          :key="option.value"
          class="base-tag-input-item"
          :value="option"
        >
          <ComboboxItemIndicator class="base-tag-input-item-indicator">
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </ComboboxItemIndicator>
          <span class="base-tag-input-item-text">{{ option.label }}</span>
        </ComboboxItem>

        <!-- Synthetic "Create '...'" option — selection is prevented from entering the model -->
        <ComboboxItem
          v-if="props.showCreateOption"
          class="base-tag-input-item base-tag-input-item-create"
          :value="{
            value: CREATE_TAG_SENTINEL,
            label: props.searchTerm.trim()
          }"
          @select.prevent="emit('create-select')"
        >
          Create '{{ props.searchTerm.trim() }}'
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</template>

<!--
  Global styles for dropdown content rendered via Portal/Teleport.
  These cannot be scoped because the content is outside the component tree.
-->
<style>
.base-tag-input-content {
  z-index: var(--z-dropdown);
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.base-tag-input-viewport {
  max-height: 200px;
  padding: var(--spacing-1);
  overflow-y: auto;
}

.base-tag-input-empty {
  padding: var(--spacing-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.base-tag-input-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  padding-left: var(--spacing-8);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  user-select: none;
}

.base-tag-input-item:focus {
  outline: none;
}

.base-tag-input-item[data-highlighted] {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.base-tag-input-item[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.base-tag-input-item[data-state='checked'] {
  background-color: var(--color-primary-subtle);
}

.base-tag-input-item[data-state='checked'][data-highlighted] {
  background-color: var(--color-primary);
}

.base-tag-input-item-indicator {
  position: absolute;
  left: var(--spacing-2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.base-tag-input-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-tag-input-item-create {
  color: var(--color-text-secondary);
  font-style: italic;
}

.base-tag-input-item-create[data-highlighted] {
  color: var(--color-text-inverse);
}
</style>
