<script setup lang="ts">
/**
 * EntryDayViewEntryEditor - Inline editor for journal entries.
 * Validates content/day, auto-focuses, warns on unsaved changes.
 *
 * @emits save-requested - Valid data submission
 * @emits edit-cancelled - Cancel/Escape action
 */

import { onMounted, onUnmounted, ref } from 'vue'

import BaseButton from '@/base/components/BaseButton.vue'
import BaseTextarea from '@/base/components/BaseTextarea.vue'

import { useEntryEditor } from '../composables/use-entry-editor'

import type { Entry } from '@/shared/types/entry-types'

const props = defineProps<{ entry: Entry }>()
const emit = defineEmits<{
  'save-requested': [data: { content: string; assignedDay: string }]
  'edit-cancelled': []
}>()
const onCancel = () => {
  emit('edit-cancelled')
}
const {
  assignedDayError,
  assignedDayValue,
  contentError,
  contentValue,
  handleBeforeUnload,
  handleKeyDown,
  updateAssignedDay
} = useEntryEditor(props.entry, onCancel)
const onDateChange = (event: Event) => {
  updateAssignedDay((event.target as HTMLInputElement).value)
}
const textareaRef = ref<{ focus: () => void }>()
const onSave = (event: Event) => {
  event.preventDefault()
  emit('save-requested', {
    content: contentValue.value,
    assignedDay: assignedDayValue.value
  })
}
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    event.stopPropagation()
    emit('save-requested', {
      content: contentValue.value,
      assignedDay: assignedDayValue.value
    })
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('keydown', handleKeyDown)
  textareaRef.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  save: () => {
    emit('save-requested', {
      content: contentValue.value,
      assignedDay: assignedDayValue.value
    })
  },
  cancel: () => {
    emit('edit-cancelled')
  }
})
</script>

<template>
  <form
    class="entry-editor"
    data-testid="entry-editor"
    @keydown="handleKeydown"
    @submit.prevent="onSave"
  >
    <div class="entry-editor-content">
      <BaseTextarea
        ref="textareaRef"
        v-model="contentValue"
        class="entry-editor-textarea"
        :error="contentError"
        label="Content"
        name="content"
        placeholder="Enter your thoughts..."
        :rows="3"
      />

      <div class="entry-editor-date">
        <label
          class="entry-editor-date-label"
          for="assignedDay"
        >
          Assigned Day
        </label>
        <input
          id="assignedDay"
          :aria-describedby="assignedDayError ? 'assignedDay-error' : undefined"
          class="entry-editor-date-input"
          :class="{ 'entry-editor-date-input-error': !!assignedDayError }"
          type="date"
          :value="assignedDayValue"
          @change="onDateChange"
          @input="onDateChange"
        />
        <p
          v-if="assignedDayError"
          id="assignedDay-error"
          class="entry-editor-date-error"
        >
          {{ assignedDayError }}
        </p>
      </div>
    </div>

    <div class="entry-editor-actions">
      <span class="keyboard-hint"> <kbd>Esc</kbd> to cancel </span>
      <div class="button-group">
        <BaseButton
          type="button"
          variant="secondary"
          @click="onCancel"
        >
          Cancel
        </BaseButton>

        <BaseButton
          type="submit"
          variant="primary"
        >
          Save
        </BaseButton>
      </div>
    </div>
  </form>
</template>

<style scoped>
.entry-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  border: 2px solid var(--color-border-focus);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.entry-editor-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.entry-editor-textarea {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
}

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

.entry-editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-3);
}

.button-group {
  display: flex;
  gap: var(--spacing-3);
}

.keyboard-hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

@media (width <= 767px) {
  .keyboard-hint {
    display: none;
  }
}

kbd {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
}
</style>
