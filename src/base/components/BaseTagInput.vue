<script setup lang="ts">
/**
 * BaseTagInput — domain-agnostic multi-select combobox for tag assignment.
 * Selected values render as removable chips. Supports inline creation.
 */

import { computed, ref, useId } from 'vue'

import { ComboboxAnchor, ComboboxInput, ComboboxRoot, useFilter } from 'reka-ui'

import BaseTagInputChips from './BaseTagInputChips.vue'
import BaseTagInputDropdown from './BaseTagInputDropdown.vue'

import type { TagInputOption } from '@/shared/types/tag-types'

interface Props {
  /** Available tag options */
  options: TagInputOption[]
  /** Input label text */
  label?: string
  /** Placeholder text for the search input */
  placeholder?: string
  /** Error message to display */
  error?: string
  /** Disable the input */
  disabled?: boolean
  /** Input name attribute */
  name?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Fired when user confirms creating a new tag; parent must persist and add to options */
  'create-tag': [name: string]
}>()

// v-model is an array of selected tag IDs (strings)
const model = defineModel<string[]>({ default: () => [] })

const comboboxId = useId()
const searchTerm = ref('')

const { contains } = useFilter({ sensitivity: 'base' })

/** Options objects corresponding to the current model value (for ComboboxRoot model-value) */
const selectedOptions = computed(() =>
  props.options.filter((opt) => model.value.includes(opt.value))
)

/** Options filtered by the current search term */
const filteredOptions = computed(() =>
  searchTerm.value
    ? props.options.filter((opt) => contains(opt.label, searchTerm.value))
    : props.options
)

/** Show the synthetic create item when a non-empty, non-exact-match term is typed */
const showCreateOption = computed(() => {
  const term = searchTerm.value.trim()
  if (!term) return false
  return !props.options.some(
    (opt) => opt.label.toLowerCase() === term.toLowerCase()
  )
})

/** Called by ComboboxRoot when selection changes (real options only; create is prevented) */
function handleModelUpdate(newOptions: TagInputOption[]) {
  model.value = newOptions.map((opt) => opt.value)
  searchTerm.value = ''
}

/** Remove a chip by its tag ID */
function removeChip(value: string) {
  model.value = model.value.filter((v) => v !== value)
}

/** Backspace on empty input removes the last chip. */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Backspace' && searchTerm.value === '') {
    if (model.value.length > 0) {
      model.value = model.value.slice(0, -1)
    }
  }
}

/** Handle selection of the synthetic create item. */
function handleCreateSelect() {
  const trimmed = searchTerm.value.trim()
  if (trimmed) {
    emit('create-tag', trimmed)
    searchTerm.value = ''
  }
}
</script>

<template>
  <div class="base-tag-input">
    <label
      v-if="label"
      class="base-tag-input-label"
      :for="comboboxId"
    >
      {{ label }}
    </label>

    <!-- Selected tag chips — rendered above the input field -->
    <BaseTagInputChips
      v-if="selectedOptions.length > 0"
      :disabled="props.disabled"
      :selected-options="selectedOptions"
      @remove-chip="removeChip"
    />

    <ComboboxRoot
      :disabled="props.disabled"
      ignore-filter
      :model-value="selectedOptions"
      multiple
      v-bind="props.name ? { name: props.name } : {}"
      @update:model-value="handleModelUpdate"
    >
      <ComboboxAnchor
        :class="[
          'base-tag-input-anchor',
          { 'base-tag-input-anchor-error': !!error }
        ]"
      >
        <ComboboxInput
          :id="comboboxId"
          v-model="searchTerm"
          :aria-describedby="error ? `${comboboxId}-error` : undefined"
          :aria-invalid="error ? true : undefined"
          class="base-tag-input-input"
          :placeholder="placeholder ?? 'Search tags...'"
          @keydown="handleKeydown"
        />
      </ComboboxAnchor>

      <BaseTagInputDropdown
        :filtered-options="filteredOptions"
        :search-term="searchTerm"
        :show-create-option="showCreateOption"
        @create-select="handleCreateSelect"
      />
    </ComboboxRoot>

    <p
      v-if="error"
      :id="`${comboboxId}-error`"
      class="base-tag-input-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-tag-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.base-tag-input-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.base-tag-input-anchor {
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

.base-tag-input-anchor:focus-within {
  border: var(--input-border-focus);
  box-shadow: var(--focus-ring);
}

.base-tag-input-anchor-error {
  border: var(--input-border-error);
}

.base-tag-input-anchor-error:focus-within {
  border: var(--input-border-error);
  box-shadow: var(--focus-ring-error);
}

.base-tag-input-input {
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

.base-tag-input-input:focus {
  outline: none;
}

.base-tag-input-input::placeholder {
  color: var(--color-text-muted);
}

.base-tag-input-error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
