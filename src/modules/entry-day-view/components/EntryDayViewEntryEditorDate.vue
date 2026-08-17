<script setup lang="ts">
/**
 * EntryDayViewEntryEditorDate
 *
 * Date field for the entry editor. Renders label, date input, and error message.
 *
 * @emits change - Fired when the date input value changes
 */

import { useId } from 'vue'

const props = defineProps<{
  /** Current date value (ISO string YYYY-MM-DD) */
  value: string
  /** Validation error message */
  error?: string
}>()

const emit = defineEmits<{
  change: [value: string]
}>()

const inputId = useId()
const errorId = `${inputId}-error`

function handleChange(event: Event): void {
  emit('change', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="entry-editor-date">
    <label
      class="entry-editor-date-label"
      :for="inputId"
    >
      Assigned Day
    </label>
    <input
      :id="inputId"
      :aria-describedby="props.error ? errorId : undefined"
      class="entry-editor-date-input"
      :class="{ 'entry-editor-date-input-error': !!props.error }"
      type="date"
      :value="props.value"
      @change="handleChange"
      @input="handleChange"
    />
    <p
      v-if="props.error"
      :id="errorId"
      class="entry-editor-date-error"
    >
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped>
.entry-editor-date {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.entry-editor-date-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.entry-editor-date-input {
  padding: var(--input-padding);
  border: var(--input-border);
  border-radius: var(--input-radius);
  background-color: var(--input-bg);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.entry-editor-date-input:focus {
  border: var(--input-border-focus);
  box-shadow: var(--focus-ring);
  outline: none;
}

.entry-editor-date-input-error {
  border: var(--input-border-error);
}

.entry-editor-date-error {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
