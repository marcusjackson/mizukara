<script setup lang="ts">
/**
 * EntryDayViewDatePicker
 *
 * Modal dialog for direct date navigation.
 * Provides text input with validation for jumping to a specific date.
 *
 * Features:
 * - HTML5 date input (native picker on mobile)
 * - ISO date format validation (YYYY-MM-DD)
 * - Focus management (auto-focus input on open)
 * - Keyboard support (Enter confirms, Escape cancels via BaseDialog)
 *
 * @emits date-selected - Emitted with valid ISO date string on confirm
 * @emits close - Emitted on cancel
 */

import { computed, nextTick, ref, watch } from 'vue'

import { BaseDialog } from '@/base/components'

import { isValidISODate } from '@/shared/utils/date-utils'
import { ENTRY_VALIDATION_ERRORS } from '@/shared/validation/validation-errors'

interface Props {
  /** Whether date picker dialog is open */
  open: boolean
  /** Initial date to show in picker (ISO string YYYY-MM-DD) */
  initialDate: string
}

interface Emits {
  /** User confirmed date selection */
  'date-selected': [date: string]
  /** User cancelled date selection */
  close: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedDate = ref(props.initialDate)
const validationError = ref<string | null>(null)
const dateInputRef = ref<HTMLInputElement | null>(null)

// Writable computed for v-model:open on BaseDialog
const dialogOpen = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close')
  }
})

watch(
  () => props.open,
  (newValue) => {
    if (newValue) {
      selectedDate.value = props.initialDate
      validationError.value = null
      void nextTick(() => {
        dateInputRef.value?.focus()
      })
    }
  }
)

watch(
  () => props.initialDate,
  (newValue) => {
    if (props.open) {
      selectedDate.value = newValue
    }
  }
)

// Clear validation error when user types
watch(selectedDate, () => {
  validationError.value = null
})

const handleDialogUpdate = (value: boolean) => {
  if (!value) {
    emit('close')
  }
}

const handleConfirm = () => {
  if (!isValidISODate(selectedDate.value)) {
    validationError.value = ENTRY_VALIDATION_ERRORS.DATE_FORMAT
    return
  }
  emit('date-selected', selectedDate.value)
}

const handleCancel = () => {
  emit('close')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleConfirm()
  }
}
</script>

<template>
  <BaseDialog
    v-model:open="dialogOpen"
    description="Navigate directly to a specific date."
    title="Jump to Date"
    @update:open="handleDialogUpdate"
  >
    <div class="date-picker-content">
      <div class="date-picker-field">
        <label
          class="date-picker-label"
          for="date-picker-input"
        >
          Select date
          <span class="date-picker-hint">(YYYY-MM-DD)</span>
        </label>
        <input
          id="date-picker-input"
          ref="dateInputRef"
          v-model="selectedDate"
          :aria-describedby="validationError ? 'date-picker-error' : undefined"
          class="date-picker-input"
          type="date"
          @keydown="handleKeydown"
        />
        <p
          v-if="validationError"
          id="date-picker-error"
          class="date-picker-error"
          role="alert"
        >
          {{ validationError }}
        </p>
      </div>

      <div class="date-picker-actions">
        <button
          class="date-picker-button date-picker-button--secondary"
          type="button"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          class="date-picker-button date-picker-button--primary"
          type="button"
          @click="handleConfirm"
        >
          Go to Date
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

<style scoped>
.date-picker-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.date-picker-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.date-picker-label {
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.date-picker-hint {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
}

.date-picker-input {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
}

.date-picker-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: var(--focus-ring);
  outline: none;
}

.date-picker-error {
  margin: 0;
  color: var(--color-danger);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
}

.date-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

.date-picker-button {
  min-width: 44px;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.date-picker-button:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

.date-picker-button--primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.date-picker-button--primary:hover {
  background: var(--color-primary-hover);
}

.date-picker-button--primary:active {
  background: var(--color-primary-active);
}

.date-picker-button--secondary {
  background: transparent;
  color: var(--color-text-secondary);
}

.date-picker-button--secondary:hover {
  background: var(--color-background);
}
</style>
