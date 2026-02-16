<script setup lang="ts">
/**
 * BaseCombobox
 *
 * A searchable single-select combobox built on Reka UI Combobox primitives.
 * Works with vee-validate through v-model.
 * Supports searching/filtering options with keyboard navigation.
 */

import { computed, ref, toRefs, useId, watch } from 'vue'

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
  /** Additional fields for multi-field search */
  [key: string]: unknown
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
  /** Display function for selected value */
  displayValue?: (option: ComboboxOption | undefined) => string
  /** Keys to search across (defaults to ['label']) */
  searchKeys?: string[]
  /** Custom display function for options in dropdown */
  displayFn?: (option: ComboboxOption) => string
}>()

const { disabled, name, options, placeholder, required, searchKeys } =
  toRefs(props)

const model = defineModel<string | number | null>()

const comboboxId = useId()
const searchTerm = ref('')

// Use Reka UI's filter utility for fuzzy matching
const { contains } = useFilter({ sensitivity: 'base' })

// Clear search term when dropdown closes or selection changes
watch(model, () => {
  searchTerm.value = ''
})

// Handle input changes - update search term when user is typing
function handleInputChange(event: Event): void {
  const target = event.target as HTMLInputElement
  searchTerm.value = target.value
}

// Filter options based on search term across multiple keys
const filteredOptions = computed(() => {
  if (!searchTerm.value) {
    return options.value
  }

  const keys = searchKeys.value ?? ['label']

  return options.value.filter((option) => {
    return keys.some((key) => {
      const val = option[key]
      if (typeof val === 'string') {
        return contains(val, searchTerm.value)
      }
      return false
    })
  })
})

// Get currently selected option
const selectedOption = computed(
  () => options.value.find((opt) => opt.value === model.value) ?? null
)

// Default display function - shows empty string when no selection
const getDisplayValue = computed(() => {
  if (props.displayValue) {
    return props.displayValue
  }
  return (option: ComboboxOption | undefined) => option?.label ?? ''
})

// Handle selection
function handleSelect(option: ComboboxOption): void {
  model.value = option.value
  searchTerm.value = ''
}

// Get display text for an option (in dropdown)
const getOptionDisplayText = computed(() => {
  if (props.displayFn) {
    return props.displayFn
  }
  return (option: ComboboxOption) => option.label
})

// Build props object for ComboboxRoot
const comboboxRootProps = computed(() => {
  const rootProps: Record<string, unknown> = {
    disabled: disabled.value || false,
    required: required.value || false,
    ignoreFilter: true // We're doing custom filtering
  }
  if (name.value) {
    rootProps['name'] = name.value
  }
  return rootProps
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
          { 'base-combobox-anchor-error': !!error }
        ]"
      >
        <ComboboxInput
          :id="comboboxId"
          :aria-describedby="error ? `${comboboxId}-error` : undefined"
          :aria-invalid="!!error"
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

<style scoped>
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

.base-combobox-trigger:hover {
  color: var(--color-text-primary);
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
</style>

<!-- 
  Global styles for Combobox content rendered via Portal/Teleport.
  These cannot be scoped because the content is rendered outside the component tree.
-->
<style>
.base-combobox-content {
  z-index: var(--z-dropdown);
  overflow: hidden;
  border: var(--card-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.base-combobox-viewport {
  max-height: 200px;
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
  padding: var(--spacing-2) var(--spacing-3);
  padding-left: var(--spacing-8);
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
  justify-content: center;
  align-items: center;
}

.base-combobox-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
