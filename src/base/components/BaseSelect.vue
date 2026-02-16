<script setup lang="ts">
/**
 * BaseSelect
 *
 * A select dropdown component built on Reka UI Select primitives.
 * Works with vee-validate through v-model.
 */

import { computed, toRefs, useId } from 'vue'

import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport
} from 'reka-ui'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = defineProps<{
  /** Select label text */
  label?: string
  /** Placeholder text when no selection */
  placeholder?: string
  /** Error message to display (undefined means no error) */
  error?: string | undefined
  /** Disable the select */
  disabled?: boolean
  /** Select name attribute */
  name?: string
  /** Make select required */
  required?: boolean
  /** Available options */
  options: SelectOption[]
}>()

const { disabled, name, required } = toRefs(props)

const model = defineModel<string | null>()

const selectId = useId()

// Build props object for SelectRoot, handling undefined values
const selectRootProps = computed(() => {
  const rootProps: Record<string, unknown> = {
    disabled: disabled.value || false,
    modelValue: model.value,
    required: required.value || false
  }
  if (name.value) {
    rootProps['name'] = name.value
  }
  return rootProps
})
</script>

<template>
  <div class="base-select">
    <label
      v-if="label"
      class="base-select-label"
      :for="selectId"
    >
      {{ label }}
      <span
        v-if="required"
        aria-hidden="true"
        class="base-select-required"
        >*</span
      >
    </label>

    <SelectRoot
      v-bind="selectRootProps"
      @update:model-value="(val: string) => (model = val)"
    >
      <SelectTrigger
        :id="selectId"
        :aria-describedby="error ? `${selectId}-error` : undefined"
        :aria-invalid="!!error"
        :class="[
          'base-select-trigger',
          { 'base-select-trigger-error': !!error }
        ]"
      >
        <SelectValue
          class="base-select-value"
          :placeholder="placeholder ?? 'Select...'"
        />
        <span
          aria-hidden="true"
          class="base-select-icon"
        >
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
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          class="base-select-content"
          position="popper"
          :side-offset="4"
        >
          <SelectViewport class="base-select-viewport">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              class="base-select-item"
              :disabled="option.disabled ?? false"
              :value="option.value"
            >
              <SelectItemIndicator class="base-select-item-indicator">
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
              </SelectItemIndicator>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <p
      v-if="error"
      :id="`${selectId}-error`"
      class="base-select-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.base-select-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.base-select-required {
  margin-left: var(--spacing-1);
  color: var(--color-error);
}

.base-select-trigger {
  display: inline-flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  height: var(--input-height);
  padding: var(--input-padding);
  border: var(--input-border);
  border-radius: var(--input-radius);
  background-color: var(--input-bg);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.base-select-trigger:focus {
  border: var(--input-border-focus);
  box-shadow: var(--focus-ring);
  outline: none;
}

.base-select-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-select-trigger[data-placeholder] {
  color: var(--color-text-muted);
}

.base-select-trigger-error {
  border: var(--input-border-error);
}

.base-select-trigger-error:focus {
  border: var(--input-border-error);
  box-shadow: var(--focus-ring-error);
}

.base-select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select-icon {
  display: flex;
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.base-select-error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>

<!-- 
  Global styles for Select content rendered via Portal/Teleport.
  These cannot be scoped because the content is rendered outside the component tree.
-->
<style>
[data-reka-popper-content-wrapper='']:has(.base-select-content) {
  z-index: var(--z-dropdown) !important;
}

.base-select-content {
  width: var(--reka-select-trigger-width);
  min-width: var(--reka-select-trigger-width);
  max-height: 400px;
  overflow: hidden;
  overflow-y: auto;
  border: var(--card-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.base-select-viewport {
  padding: var(--spacing-1);
}

.base-select-item {
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

.base-select-item:focus {
  outline: none;
}

.base-select-item[data-highlighted] {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.base-select-item[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.base-select-item-indicator {
  position: absolute;
  left: var(--spacing-2);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
