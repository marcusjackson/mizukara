<script setup lang="ts">
/**
 * BaseButton
 *
 * A generic button component built on Reka UI primitives.
 * Supports primary, secondary, and ghost variants with multiple sizes.
 */

import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  /** Button variant style */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Disable the button */
  disabled?: boolean
  /** Show loading spinner */
  loading?: boolean
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset'
  /** Form ID for submission (HTML form attribute) */
  form?: string | undefined
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
  form: undefined
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const classes = computed(() => [
  'base-button',
  `base-button-${props.variant}`,
  `base-button-${props.size}`,
  {
    'base-button-disabled': props.disabled || props.loading,
    'base-button-loading': props.loading
  }
])
</script>

<template>
  <button
    :aria-busy="loading || undefined"
    :class="classes"
    :disabled="disabled || loading"
    v-bind="form ? { form } : {}"
    :type="type"
    @click="emit('click', $event)"
  >
    <span
      v-if="loading"
      aria-hidden="true"
      class="base-button-spinner"
    />
    <span :class="{ 'base-button-content-hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.base-button:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

/* Sizes */
.base-button-sm {
  height: var(--button-height-sm);
  padding: var(--button-padding-sm);
  font-size: var(--font-size-sm);
}

.base-button-md {
  height: var(--button-height-md);
  padding: var(--button-padding-md);
  font-size: var(--font-size-base);
}

.base-button-lg {
  height: var(--button-height-lg);
  padding: var(--button-padding-lg);
  font-size: var(--font-size-lg);
}

/* Primary variant */
.base-button-primary {
  background-color: var(--button-primary-bg);
  color: var(--button-primary-text);
}

.base-button-primary:hover:not(:disabled) {
  background-color: var(--button-primary-hover-bg);
}

.base-button-primary:active:not(:disabled) {
  background-color: var(--color-primary-active);
}

/* Secondary variant */
.base-button-secondary {
  border-color: var(--button-secondary-border);
  background-color: var(--button-secondary-bg);
  color: var(--button-secondary-text);
}

.base-button-secondary:hover:not(:disabled) {
  background-color: var(--button-secondary-hover-bg);
}

.base-button-secondary:active:not(:disabled) {
  background-color: var(--color-background);
}

/* Ghost variant */
.base-button-ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}

.base-button-ghost:hover:not(:disabled) {
  background-color: var(--color-surface);
}

.base-button-ghost:active:not(:disabled) {
  background-color: var(--color-background);
}

/* Danger variant */
.base-button-danger {
  background-color: var(--color-danger);
  color: var(--color-danger-text);
}

.base-button-danger:hover:not(:disabled) {
  background-color: var(--color-danger-hover);
}

.base-button-danger:active:not(:disabled) {
  background-color: var(--color-danger-active);
}

/* Disabled state */
.base-button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading state */
.base-button-loading {
  position: relative;
}

.base-button-spinner {
  position: absolute;
  width: 1em;
  height: 1em;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: spin var(--transition-slow) linear infinite;
}

.base-button-content-hidden {
  visibility: hidden;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
