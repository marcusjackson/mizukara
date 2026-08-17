<script setup lang="ts">
/**
 * EntryDayViewCreateForm
 *
 * Form component for creating new journal entries.
 * Provides a quick input interface for adding entries to the current day.
 *
 * Features:
 * - Validates content (non-empty, max 10,000 chars)
 * - Auto-clears form after successful submission
 * - Auto-focuses textarea after submission
 * - Keyboard shortcuts: Cmd/Ctrl+S to save, Escape to clear
 * - Accessible keyboard hints (hidden on mobile)
 *
 * @emits entry-created - Emitted when user submits valid entry with { content, assignedDay }
 *
 * @example
 * ```vue
 * <EntryDayViewCreateForm
 *   default-assigned-day="2026-02-11"
 *   @entry-created="createEntry"
 * />
 * ```
 */

import { computed, ref } from 'vue'

import { toTypedSchema } from '@vee-validate/zod'
import { useField, useForm } from 'vee-validate'

import BaseButton from '@/base/components/BaseButton.vue'
import BaseTextarea from '@/base/components/BaseTextarea.vue'

import { entryCreateFormSchema } from '../schemas/entry-create-form-schema'

interface Props {
  defaultAssignedDay: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'entry-created': [data: { content: string; assignedDay: string }]
}>()

// Form setup with vee-validate
const schema = toTypedSchema(entryCreateFormSchema)
const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    content: ''
  }
})

const { errorMessage, value: content } = useField<string>('content')

const textareaRef = ref<InstanceType<typeof BaseTextarea> | null>(null)

const isContentEmpty = computed(() => !content.value.trim())

const onSubmit = handleSubmit((values) => {
  emit('entry-created', {
    content: values.content,
    assignedDay: props.defaultAssignedDay
  })

  // Clear form and refocus
  resetForm()
  textareaRef.value?.focus()
})

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    event.stopPropagation() // Prevent Root's global handler from also triggering
    void onSubmit()
  } else if (event.key === 'Escape') {
    resetForm()
  }
}

/**
 * Focus the textarea
 * Exposed for parent components to trigger focus programmatically
 */
const focus = () => {
  textareaRef.value?.focus()
}

/**
 * Submit the form programmatically
 * Exposed for parent components (e.g., global keyboard shortcut handler)
 */
const submit = () => {
  void onSubmit()
}

/**
 * Clear the form
 * Exposed for parent components (e.g., global Escape handler)
 */
const clear = () => {
  resetForm()
}

defineExpose({
  focus,
  submit,
  clear
})
</script>

<template>
  <form
    class="create-form"
    data-testid="create-form"
    @keydown="handleKeydown"
    @submit.prevent="onSubmit"
  >
    <BaseTextarea
      ref="textareaRef"
      v-model="content"
      auto-expand
      :error="errorMessage"
      label="Content"
      :max-rows="8"
      name="content"
      placeholder="What happened today?"
      :rows="3"
    />
    <div class="form-actions">
      <BaseButton
        :disabled="isContentEmpty"
        type="submit"
        variant="primary"
      >
        New Entry
      </BaseButton>
      <span class="keyboard-hint">
        <kbd>⌘/Ctrl+S</kbd> to save • <kbd>Esc</kbd> to clear
      </span>
    </div>
  </form>
</template>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-5);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

@media (width <= 767px) {
  .create-form {
    padding: var(--spacing-4);
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
