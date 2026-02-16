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
  <div
    :aria-label="label"
    class="base-spinner"
    :class="`base-spinner-${size}`"
    role="status"
  >
    <span class="base-spinner-circle" />
    <span class="visually-hidden">{{ label }}</span>
  </div>
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
  animation: spin 0.8s linear infinite;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  border: 0;
  white-space: nowrap;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
