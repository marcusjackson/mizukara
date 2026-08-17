<script setup lang="ts">
/**
 * BaseSwitch
 *
 * A toggle switch component built on Reka UI Switch primitives.
 * Supports v-model for on/off state and optional label.
 */

import { computed, useId } from 'vue'

import { SwitchRoot, SwitchThumb } from 'reka-ui'

interface Props {
  /** Aria label for accessibility */
  ariaLabel?: string
  /** Disable the switch */
  disabled?: boolean
  /** Error message */
  error?: string
  /** Label text (alternative to slot) */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: '',
  disabled: false,
  error: '',
  label: ''
})

const checked = defineModel<boolean>({ default: false })

const switchId = useId()
const hasError = computed(() => Boolean(props.error))
</script>

<template>
  <div class="base-switch">
    <div class="base-switch-wrapper">
      <SwitchRoot
        :id="switchId"
        v-model="checked"
        :aria-label="ariaLabel || label || undefined"
        v-bind="disabled ? { disabled: true } : {}"
        class="base-switch-root"
        :class="{
          'base-switch-root--checked': checked,
          'base-switch-root-error': hasError
        }"
      >
        <SwitchThumb class="base-switch-thumb" />
      </SwitchRoot>
      <label
        v-if="label || $slots['default']"
        class="base-switch-label"
        :for="switchId"
      >
        <slot>{{ label }}</slot>
      </label>
    </div>
    <p
      v-if="hasError"
      aria-live="polite"
      class="base-switch-error-message"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-switch {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.base-switch-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.base-switch-root {
  /* Component-scoped tokens for switch anatomy */
  --switch-track-width: calc(var(--spacing-10) + var(--spacing-1)); /* 44px */
  --switch-track-height: var(--spacing-6); /* 24px */
  --switch-thumb-size: var(--spacing-5); /* 20px */
  --switch-thumb-offset: 2px;
  --switch-thumb-translate: 20px;

  position: relative;
  box-sizing: border-box;
  width: var(--switch-track-width);
  height: var(--switch-track-height);
  border-radius: var(--radius-full);
  background-color: var(--color-border);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.base-switch-root:hover {
  background-color: var(--color-border-focus);
}

.base-switch-root:focus-visible {
  box-shadow: var(--focus-ring);
  outline: none;
}

.base-switch-root[data-state='checked'] {
  background-color: var(--color-primary);
}

.base-switch-root[data-state='checked']:hover {
  background-color: var(--color-primary-hover);
}

.base-switch-root[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-switch-root-error {
  background-color: var(--color-error);
}

.base-switch-thumb {
  position: absolute;
  top: var(--switch-thumb-offset);
  left: var(--switch-thumb-offset);
  display: block;
  width: var(--switch-thumb-size);
  height: var(--switch-thumb-size);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-raised);
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast);
  transform: translateX(var(--switch-thumb-offset));
}

.base-switch-root[data-state='checked'] .base-switch-thumb {
  background-color: var(--color-surface);
  transform: translateX(var(--switch-thumb-translate));
}

.base-switch-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  cursor: pointer;
  user-select: none;
}

.base-switch-root[data-disabled] ~ .base-switch-label {
  cursor: not-allowed;
}

.base-switch-error-message {
  margin: 0;
  padding-left: calc(var(--switch-track-width) + var(--spacing-2));
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
