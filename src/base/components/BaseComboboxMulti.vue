<script setup lang="ts">
/**
 * BaseComboboxMulti
 *
 * A multi-select searchable combobox component built on Reka UI Combobox primitives.
 * Works with vee-validate through v-model.
 * Displays selected items as removable chips.
 */

import { computed, ref, toRefs, useId } from 'vue'

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
  ComboboxViewport,
  useFilter
} from 'reka-ui'

export interface ComboboxOption {
  value: string | number
  label: string
  disabled?: boolean
}

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

const { disabled, name, options, placeholder, required } = toRefs(props)

// Model is an array of values (numbers or strings)
const model = defineModel<(string | number)[]>({ default: () => [] })

const comboboxId = useId()
const searchTerm = ref('')

// Use Reka UI's filter utility for fuzzy matching
const { contains } = useFilter({ sensitivity: 'base' })

// Filter options based on search term
const filteredOptions = computed(() => {
  if (!searchTerm.value) {
    return options.value
  }
  return options.value.filter((option) =>
    contains(option.label, searchTerm.value)
  )
})

// Get selected options as full objects (for chips display and Reka UI model)
const selectedOptions = computed(() =>
  options.value.filter((opt) => model.value.includes(opt.value))
)

// Watch for Reka UI model changes and sync back to our value array model
function handleModelUpdate(newOptions: ComboboxOption[]) {
  model.value = newOptions.map((opt) => opt.value)
  // Clear search term after selection
  searchTerm.value = ''
}

// Remove a selected item
function removeItem(value: string | number) {
  model.value = model.value.filter((v) => v !== value)
}

// Build props object for ComboboxRoot
const comboboxRootProps = computed(() => {
  const rootProps: Record<string, unknown> = {
    disabled: disabled.value || false,
    required: required.value || false,
    ignoreFilter: true, // We're doing custom filtering
    multiple: true
  }
  if (name.value) {
    rootProps['name'] = name.value
  }
  return rootProps
})
</script>

<template>
  <div class="base-combobox-multi">
    <label
      v-if="label"
      class="base-combobox-multi-label"
      :for="comboboxId"
    >
      {{ label }}
      <span
        v-if="required"
        aria-hidden="true"
        class="base-combobox-multi-required"
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
          'base-combobox-multi-anchor',
          { 'base-combobox-multi-anchor-error': !!error }
        ]"
      >
        <ComboboxInput
          :id="comboboxId"
          v-model="searchTerm"
          :aria-describedby="error ? `${comboboxId}-error` : undefined"
          :aria-invalid="!!error"
          class="base-combobox-multi-input"
          :placeholder="placeholder ?? 'Search...'"
        />
        <ComboboxTrigger
          aria-label="Toggle options"
          class="base-combobox-multi-trigger"
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
          class="base-combobox-multi-content"
          position="popper"
          :side-offset="4"
        >
          <ComboboxViewport class="base-combobox-multi-viewport">
            <ComboboxEmpty class="base-combobox-multi-empty">
              No results found
            </ComboboxEmpty>

            <ComboboxItem
              v-for="option in filteredOptions"
              :key="String(option.value)"
              class="base-combobox-multi-item"
              :disabled="option.disabled ?? false"
              :value="option"
            >
              <ComboboxItemIndicator class="base-combobox-multi-item-indicator">
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
              <span class="base-combobox-multi-item-text">{{
                option.label
              }}</span>
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
        class="base-combobox-multi-chip"
        :disabled="disabled"
        type="button"
        @click="removeItem(option.value)"
      >
        <span class="base-combobox-multi-chip-text">{{ option.label }}</span>
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
        <span class="sr-only">Remove {{ option.label }}</span>
      </button>
    </div>

    <p
      v-if="error"
      :id="`${comboboxId}-error`"
      class="base-combobox-multi-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-combobox-multi {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.base-combobox-multi-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.base-combobox-multi-required {
  margin-left: var(--spacing-1);
  color: var(--color-error);
}

.base-combobox-multi-anchor {
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

.base-combobox-multi-anchor:focus-within {
  border: var(--input-border-focus);
  box-shadow: var(--focus-ring);
}

.base-combobox-multi-anchor-error {
  border: var(--input-border-error);
}

.base-combobox-multi-anchor-error:focus-within {
  border: var(--input-border-error);
  box-shadow: var(--focus-ring-error);
}

.base-combobox-multi-input {
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

.base-combobox-multi-input:focus {
  outline: none;
}

.base-combobox-multi-input::placeholder {
  color: var(--color-text-muted);
}

.base-combobox-multi-trigger {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 100%;
  padding-right: var(--spacing-2);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.base-combobox-multi-trigger:hover {
  color: var(--color-text-primary);
}

.base-combobox-multi-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-combobox-multi-error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

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
  max-width: 150px;
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

/* Screen reader only class */
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

<!-- 
  Global styles for Combobox content rendered via Portal/Teleport.
  These cannot be scoped because the content is rendered outside the component tree.
-->
<style>
.base-combobox-multi-content {
  z-index: var(--z-dropdown);
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.base-combobox-multi-viewport {
  max-height: 200px;
  padding: var(--spacing-1);
  overflow-y: auto;
}

.base-combobox-multi-empty {
  padding: var(--spacing-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.base-combobox-multi-item {
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

.base-combobox-multi-item-indicator {
  position: absolute;
  left: var(--spacing-2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.base-combobox-multi-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
