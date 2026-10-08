<script setup lang="ts">
import { computed } from 'vue'

/**
 * BaseProgress
 *
 * A determinate progress bar, for work whose completion is actually known.
 * Use BaseSpinner instead when it is not — a bar sitting at zero reads as
 * broken, where a spinner reads as waiting.
 */

const props = withDefaults(
  defineProps<{
    /** Completion from 0 to 100. Values outside that range are clamped. */
    value: number
    /** Accessible name describing what is progressing. */
    label: string
    /** Whether to render the percentage as visible text beside the bar. */
    showValue?: boolean
  }>(),
  {
    showValue: true
  }
)

const clampedValue = computed(() =>
  Math.round(Math.min(100, Math.max(0, props.value)))
)

/**
 * A deliberately coarse announcement.
 *
 * Progress changes many times a second; announcing every one makes the bar
 * unusable with a screen reader. Rounding to the nearest ten means the live
 * region's text only changes about ten times over a whole download.
 */
const announcedValue = computed(() => Math.round(clampedValue.value / 10) * 10)
</script>

<template>
  <div class="base-progress">
    <div
      :aria-label="label"
      :aria-valuemax="100"
      :aria-valuemin="0"
      :aria-valuenow="clampedValue"
      class="base-progress-track"
      role="progressbar"
    >
      <div
        class="base-progress-fill"
        :style="{ width: `${clampedValue}%` }"
      />
    </div>
    <p
      v-if="showValue"
      aria-live="polite"
      class="base-progress-value"
    >
      <span aria-hidden="true">{{ clampedValue }}%</span>
      <span class="base-progress-announcement">
        {{ label }} {{ announcedValue }} percent
      </span>
    </p>
  </div>
</template>

<style scoped>
.base-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
}

.base-progress-track {
  flex: 1;
  height: var(--spacing-2);
  overflow: hidden;
  border-radius: var(--radius-full);
  background-color: var(--color-border);
}

.base-progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  transition: width var(--transition-normal) ease-out;
}

.base-progress-value {
  min-width: var(--spacing-10);
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Visible to assistive technology only — the sighted reading is the digits. */
.base-progress-announcement {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .base-progress-fill {
    transition: none;
  }
}
</style>
