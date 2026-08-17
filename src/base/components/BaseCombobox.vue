<script setup lang="ts">
/**
 * BaseCombobox
 *
 * A searchable single-select combobox built on Reka UI Combobox primitives.
 * Works with vee-validate through v-model.
 * Supports searching/filtering options with keyboard navigation.
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

import { useCombobox } from '@/base/composables/use-combobox'

import type { ComboboxOption } from '@/base/composables/use-combobox'

export type { ComboboxOption } from '@/base/composables/use-combobox'

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
  /** Display function for selected value */
  displayValue?: (option: ComboboxOption | undefined) => string
  /** Keys to search across (defaults to ['label']) */
  searchKeys?: string[]
  /** Custom display function for options in dropdown */
  displayFn?: (option: ComboboxOption) => string
}>()

const {
  disabled,
  displayFn,
  displayValue,
  name,
  options,
  required,
  searchKeys
} = toRefs(props)

const model = defineModel<string | number | null>({ default: null })

const comboboxId = useId()

const {
  comboboxRootProps,
  filteredOptions,
  getDisplayValue,
  getOptionDisplayText,
  handleInputChange,
  handleSelect,
  searchTerm,
  selectedOption
} = useCombobox(model, options, {
  disabled,
  displayFn,
  displayValue,
  name,
  required,
  searchKeys
})
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
      :model-value="selectedOption"
      @update:model-value="
        (val: ComboboxOption | null) => val && handleSelect(val)
      "
    >
      <ComboboxAnchor
        :class="[
          'base-combobox-anchor',
          { 'base-combobox-anchor-error': Boolean(error) }
        ]"
      >
        <ComboboxInput
          :id="comboboxId"
          :aria-describedby="error ? `${comboboxId}-error` : undefined"
          :aria-invalid="Boolean(error)"
          class="base-combobox-input"
          :display-value="getDisplayValue"
          :placeholder="placeholder ?? 'Search...'"
          @input="handleInputChange"
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
            <slot
              name="empty"
              :search-term="searchTerm"
            >
              <ComboboxEmpty class="base-combobox-empty">
                No results found
              </ComboboxEmpty>
            </slot>

            <ComboboxItem
              v-for="option in filteredOptions"
              :key="String(option.value)"
              class="base-combobox-item"
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
              <span class="base-combobox-item-text">
                <slot
                  name="option"
                  :option="option"
                  >{{ getOptionDisplayText(option) }}</slot
                >
              </span>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>

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

<!--
  Global styles for BaseCombobox and BaseComboboxMulti.
  These classes are shared between both combobox variants; keeping them global
  avoids duplicating the same rules under different scoped data-attribute
  selectors. Class names are namespaced with `base-combobox-` to prevent
  collisions.
-->
<style>
.base-combobox {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.base-combobox-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.base-combobox-required {
  margin-left: var(--spacing-1);
  color: var(--color-error);
}

.base-combobox-anchor {
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--input-height);
  border: var(--input-border);
  border-radius: var(--input-radius);
  background-color: var(--input-bg);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.base-combobox-anchor:focus-within {
  border: var(--input-border-focus);
  box-shadow: var(--focus-ring);
}

.base-combobox-anchor-error {
  border: var(--input-border-error);
}

.base-combobox-anchor-error:focus-within {
  border: var(--input-border-error);
  box-shadow: var(--focus-ring-error);
}

.base-combobox-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: var(--input-padding);
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
}

.base-combobox-input:focus {
  outline: none;
}

.base-combobox-input::placeholder {
  color: var(--color-text-muted);
}

.base-combobox-trigger {
  display: flex;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 100%;
  padding-right: var(--spacing-2);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.base-combobox-trigger:hover {
  color: var(--color-text-primary);
}

.base-combobox-trigger:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

.base-combobox-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-combobox-error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.base-combobox-content {
  z-index: var(--z-dropdown);
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.base-combobox-viewport {
  max-height: var(--combobox-max-height, 200px);
  padding: var(--spacing-1);
  overflow-y: auto;
}

.base-combobox-empty {
  padding: var(--spacing-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.base-combobox-item {
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

.base-combobox-item:focus {
  outline: none;
}

.base-combobox-item[data-highlighted] {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.base-combobox-item[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.base-combobox-item-indicator {
  position: absolute;
  left: var(--spacing-2);
  display: flex;
  place-items: center;
}

.base-combobox-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
