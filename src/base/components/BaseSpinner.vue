<script setup lang="ts">
/**
 * BaseSpinner
 *
 * A loading spinner component with size variants.
 */

type SpinnerSize = 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    /** Spinner size */
    size?: SpinnerSize
    /** Accessible label for screen readers */
    label?: string
  }>(),
  {
    size: 'md',
    label: 'Loading...'
  }
)
</script>

<template>
  <output
    :aria-label="label"
    class="base-spinner"
    :class="`base-spinner-${size}`"
  >
    <span class="base-spinner-circle" />
  </output>
</template>

<style scoped>
.base-spinner {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.base-spinner-sm {
  width: var(--spacing-4);
  height: var(--spacing-4);
}

.base-spinner-md {
  width: var(--spacing-6);
  height: var(--spacing-6);
}

.base-spinner-lg {
  width: var(--spacing-8);
  height: var(--spacing-8);
}

.base-spinner-circle {
  width: 100%;
  height: 100%;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin var(--transition-slow) linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
