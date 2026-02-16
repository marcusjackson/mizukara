<script setup lang="ts">
/**
 * BaseBadge
 *
 * A small badge/tag component for displaying labels, status indicators,
 * or classification tags. Supports multiple visual variants.
 */

withDefaults(
  defineProps<{
    /** Visual variant */
    variant?: 'default' | 'primary' | 'secondary' | 'muted'
    /** Size variant */
    size?: 'sm' | 'md'
  }>(),
  {
    variant: 'default',
    size: 'md'
  }
)
</script>

<template>
  <span
    :class="['base-badge', `base-badge-${variant}`, `base-badge-size-${size}`]"
  >
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

/* Size variants */
.base-badge-size-sm {
  padding: var(--spacing-0-5) var(--spacing-2);
  font-size: var(--font-size-xs);
}

.base-badge-size-md {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-sm);
}

/* Visual variants */
.base-badge-default {
  background-color: var(--color-bg-muted);
  color: var(--color-text-primary);
}

.base-badge-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.base-badge-secondary {
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
}

.base-badge-muted {
  background-color: var(--color-bg-muted);
  color: var(--color-text-muted);
}
</style>
