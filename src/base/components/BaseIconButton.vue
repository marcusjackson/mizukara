<script setup lang="ts">
/**
 * BaseIconButton
 *
 * A generic 44x44 icon-only button. Renders a RouterLink when `to` is
 * provided, otherwise a plain button that emits `click` — covering both
 * navigation and in-place action use cases with one shared hit-target,
 * hover, and focus-visible treatment.
 */

import { RouterLink } from 'vue-router'

import type { RouteLocationRaw } from 'vue-router'

interface Props {
  /**
   * Accessible label — the button carries no visible text, so this should
   * always be passed. Declared optional (with an empty-string default)
   * rather than required because vue-tsc doesn't apply its kebab-case ->
   * camelCase attribute mapping to required props, which would otherwise
   * make every `aria-label="..."` usage in a consuming template fail
   * type-check.
   */
  ariaLabel?: string
  /** Route to navigate to. Renders a RouterLink instead of a button when set */
  to?: RouteLocationRaw | undefined
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: '',
  to: undefined
})

const emit = defineEmits<{
  click: []
}>()

function handleClick(): void {
  if (!props.to) emit('click')
}
</script>

<template>
  <RouterLink
    v-if="to"
    :aria-label="ariaLabel"
    class="base-icon-button"
    :to="to"
  >
    <slot />
  </RouterLink>
  <button
    v-else
    :aria-label="ariaLabel"
    class="base-icon-button"
    type="button"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-icon-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  border: none;
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.base-icon-button:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.base-icon-button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.base-icon-button :deep(svg) {
  display: block;
}
</style>
