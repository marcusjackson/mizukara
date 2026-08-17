<script setup lang="ts">
/**
 * BaseTextarea
 *
 * A generic textarea component with label and error state support.
 * Works with vee-validate through v-model.
 */

import { computed, ref, useId } from 'vue'

import { useAutoExpandTextarea } from '../composables/use-auto-expand-textarea'

const props = defineProps<{
  /** Textarea label text */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Error message to display (undefined means no error) */
  error?: string | undefined
  /** Disable the textarea */
  disabled?: boolean
  /** Textarea name attribute */
  name?: string
  /** Make textarea required */
  required?: boolean
  /** Number of visible text lines (minimum when autoExpand is enabled) */
  rows?: number
  /** Auto-expand textarea height to fit content as the user types */
  autoExpand?: boolean
  /** Maximum number of rows when autoExpand is enabled (default: unlimited) */
  maxRows?: number
}>()

const model = defineModel<string | undefined>()

const textareaId = useId()
const textareaEl = ref<HTMLTextAreaElement | null>(null)

const textareaClasses = computed(() => [
  'base-textarea-field',
  {
    'base-textarea-field-error': !!props.error,
    'base-textarea-field-disabled': props.disabled,
    'base-textarea-field-auto-expand': props.autoExpand
  }
])

useAutoExpandTextarea(textareaEl, model, {
  enabled: computed(() => props.autoExpand),
  ...(props.maxRows === undefined ? {} : { maxRows: props.maxRows })
})

// Expose the textarea element for programmatic focus
defineExpose({
  focus: () => {
    textareaEl.value?.focus()
  }
})
</script>

<template>
  <div class="base-textarea">
    <label
      v-if="label"
      class="base-textarea-label"
      :for="textareaId"
    >
      {{ label }}
      <span
        v-if="required"
        aria-hidden="true"
        class="base-textarea-required"
        >*</span
      >
    </label>

    <textarea
      :id="textareaId"
      ref="textareaEl"
      v-model="model"
      :aria-describedby="error ? `${textareaId}-error` : undefined"
      :aria-invalid="!!error"
      :class="textareaClasses"
      :disabled="disabled"
      :name="name"
      :placeholder="placeholder ?? ''"
      :required="required"
      :rows="rows ?? 4"
    />

    <p
      v-if="error"
      :id="`${textareaId}-error`"
      class="base-textarea-error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-textarea {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.base-textarea-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.base-textarea-required {
  margin-left: var(--spacing-1);
  color: var(--color-error);
}

.base-textarea-field {
  padding: var(--input-padding);
  border: var(--input-border);
  border-radius: var(--input-radius);
  background-color: var(--input-bg);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  resize: vertical;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.base-textarea-field-auto-expand {
  resize: none;
  overflow: hidden;
}

.base-textarea-field::placeholder {
  color: var(--color-text-muted);
}

.base-textarea-field:focus {
  border: var(--input-border-focus);
  box-shadow: var(--focus-ring);
  outline: none;
}

.base-textarea-field-error {
  border: var(--input-border-error);
}

.base-textarea-field-error:focus {
  border: var(--input-border-error);
  box-shadow: var(--focus-ring-error);
}

.base-textarea-field-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-textarea-error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
