<script setup lang="ts">
/**
 * BaseInput
 *
 * A generic text input component with label and error state support.
 * Works with vee-validate through v-model.
 */

import { computed, useId } from 'vue'

const props = defineProps<{
  /** Input label text */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Error message to display (undefined means no error) */
  error?: string | undefined
  /** Disable the input */
  disabled?: boolean
  /** HTML input type */
  type?: 'text' | 'email' | 'password' | 'number'
  /** Input name attribute */
  name?: string
  /** Make input required */
  required?: boolean
  /** Maximum length for text inputs */
  maxlength?: string | number
}>()

const model = defineModel<string | number | undefined>()

const inputId = useId()

const inputClasses = computed(() => [
  'base-input-field',
  {
    'base-input-field-error': !!props.error,
    'base-input-field-disabled': props.disabled
  }
])
</script>

<template>
  <div class="base-input">
    <label
      v-if="label"
      class="base-input-label"
      :for="inputId"
    >
      {{ label }}
      <span
        v-if="required"
        aria-hidden="true"
        class="base-input-required"
        >*</span
      >
    </label>

    <input
      :id="inputId"
      v-model="model"
      :aria-describedby="error ? `${inputId}-error` : undefined"
      :aria-invalid="!!error"
      :class="inputClasses"
      :disabled="disabled"
      :maxlength="maxlength"
      :name="name"
      :placeholder="placeholder ?? ''"
      :required="required"
      :type="type ?? 'text'"
    />

    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="base-input-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.base-input-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.base-input-required {
  margin-left: var(--spacing-1);
  color: var(--color-error);
}

.base-input-field {
  height: var(--input-height);
  padding: var(--input-padding);
  border: var(--input-border);
  border-radius: var(--input-radius);
  background-color: var(--input-bg);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.base-input-field::placeholder {
  color: var(--color-text-muted);
}

.base-input-field:focus {
  border: var(--input-border-focus);
  box-shadow: var(--focus-ring);
  outline: none;
}

.base-input-field-error {
  border: var(--input-border-error);
}

.base-input-field-error:focus {
  border: var(--input-border-error);
  box-shadow: var(--focus-ring-error);
}

.base-input-field-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-input-error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
