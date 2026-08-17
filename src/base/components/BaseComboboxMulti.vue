<script setup lang="ts">
/**
 * BaseComboboxMulti
 *
 * A multi-select searchable combobox component built on Reka UI Combobox primitives.
 * Works with vee-validate through v-model.
 * Displays selected items as removable chips.
 */

import { toRefs, useId } from 'vue'

import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport
} from 'reka-ui'

import { useComboboxMulti } from '@/base/composables/use-combobox-multi'

import type { ComboboxOption } from '@/base/composables/use-combobox-multi'

export type { ComboboxOption } from '@/base/composables/use-combobox-multi'

const props = defineProps<{
  /** Combobox label text */
  label?: string
  /** Placeholder text when no selection */
  placeholder?: string
  /** Error message to display (undefined means no error) */
  error?: string | undefined
  /** Disable the combobox */
  disabled?: boolean
  /** Combobox name attribute */
  name?: string
  /** Make combobox required */
  required?: boolean
  /** Available options */
  options: ComboboxOption[]
}>()

const { disabled, name, options, required } = toRefs(props)

// Model is an array of values (numbers or strings)
const model = defineModel<(string | number)[]>({ default: () => [] })

const comboboxId = useId()

const {
  comboboxRootProps,
  filteredOptions,
  handleModelUpdate,
  removeItem,
  searchTerm,
  selectedOptions
} = useComboboxMulti(model, options, { disabled, name, required })
</script>

<template>
  <div class="base-combobox">
    <label
      v-if="label"
      class="base-combobox-label"
      :for="comboboxId"
    >
      {{ label }}
      <span
        v-if="required"
        aria-hidden="true"
        class="base-combobox-required"
        >*</span
      >
    </label>

    <ComboboxRoot
      v-bind="comboboxRootProps"
      :model-value="selectedOptions"
      @update:model-value="handleModelUpdate"
    >
      <ComboboxAnchor
        :class="[
          'base-combobox-anchor',
          { 'base-combobox-anchor-error': Boolean(error) }
        ]"
      >
        <ComboboxInput
          :id="comboboxId"
          v-model="searchTerm"
          :aria-describedby="error ? `${comboboxId}-error` : undefined"
          :aria-invalid="Boolean(error)"
          class="base-combobox-input"
          :placeholder="placeholder ?? 'Search...'"
        />
        <ComboboxTrigger
          aria-label="Toggle options"
          class="base-combobox-trigger"
        >
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
            <path d="m6 9 6 6 6-6" />
          </svg>
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxPortal>
        <ComboboxContent
          class="base-combobox-content"
          position="popper"
          :side-offset="4"
        >
          <ComboboxViewport class="base-combobox-viewport">
            <ComboboxEmpty class="base-combobox-empty">
              No results found
            </ComboboxEmpty>

            <ComboboxItem
              v-for="option in filteredOptions"
              :key="String(option.value)"
              class="base-combobox-multi-item"
              :disabled="option.disabled ?? false"
              :value="option"
            >
              <ComboboxItemIndicator class="base-combobox-item-indicator">
                <svg
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
              <span class="base-combobox-item-text">{{ option.label }}</span>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>

    <!-- Selected items as chips -->
    <div
      v-if="selectedOptions.length > 0"
      class="base-combobox-multi-chips"
      data-testid="selected-chips"
    >
      <button
        v-for="option in selectedOptions"
        :key="String(option.value)"
        :aria-label="`Remove ${option.label}`"
        class="base-combobox-multi-chip"
        :disabled="disabled"
        type="button"
        @click="removeItem(option.value)"
      >
        <span
          aria-hidden="true"
          class="base-combobox-multi-chip-text"
          >{{ option.label }}</span
        >
        <svg
          aria-hidden="true"
          class="base-combobox-multi-chip-remove"
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
      </button>
    </div>

    <p
      v-if="error"
      :id="`${comboboxId}-error`"
      class="base-combobox-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
/* Chips container */
.base-combobox-multi-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  margin-top: var(--spacing-1);
}

/* Individual chip */
.base-combobox-multi-chip {
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

.base-combobox-multi-chip:hover:not(:disabled) {
  border-color: var(--color-error);
  background-color: var(--color-error-subtle);
}

.base-combobox-multi-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-combobox-multi-chip-text {
  max-width: var(--combobox-chip-max-width, 150px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-combobox-multi-chip-remove {
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.base-combobox-multi-chip:hover:not(:disabled)
  .base-combobox-multi-chip-remove {
  color: var(--color-error);
}
</style>

<!--
  Global styles for multi-select dropdown items.
  Uses base-combobox-multi-item class (not base-combobox-item) to add
  the checked-state highlight unique to multi-select behaviour.
-->
<style>
.base-combobox-multi-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-2) var(--spacing-8);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  user-select: none;
}

.base-combobox-multi-item:focus {
  outline: none;
}

.base-combobox-multi-item[data-highlighted] {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.base-combobox-multi-item[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.base-combobox-multi-item[data-state='checked'] {
  background-color: var(--color-primary-subtle);
}

.base-combobox-multi-item[data-state='checked'][data-highlighted] {
  background-color: var(--color-primary);
}
</style>
