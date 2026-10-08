<script setup lang="ts">
/**
 * AppSettingsLocalInferenceModelRow
 *
 * The model: what it is, what it costs to download, and the one action
 * available for it right now. Installed means in use — there is nothing to
 * select.
 */

import { computed } from 'vue'

import { BaseButton, BaseProgress } from '@/base/components'

import type {
  LocalInferenceModel,
  ModelInstallState
} from '@/modules/local-inference/local-inference-types'

const props = defineProps<{
  model: LocalInferenceModel
  installState: ModelInstallState | undefined
  isDownloading: boolean
  /** Download completion, while downloading. */
  downloadProgress: number | null
  /** Whether the engine is busy with something else. */
  isBusy: boolean
}>()

const emit = defineEmits<{
  download: []
  cancel: []
  delete: []
}>()

const megabytes = computed(() =>
  Math.round(props.model.downloadBytes / (1024 * 1024))
)

const isInstalled = computed(() => props.installState?.isInstalled === true)

/**
 * A partial download leaves files behind that cannot be loaded. Deletion is
 * offered for those too, or a cancelled download becomes unremovable.
 */
const hasRemovableFiles = computed(
  () => props.installState?.hasAnyFiles === true
)
</script>

<template>
  <div class="app-settings-model-row">
    <div class="app-settings-model-info">
      <span class="app-settings-model-name">
        {{ model.name }}
        <span class="app-settings-model-size">{{ megabytes }} MB</span>
      </span>
      <span class="app-settings-model-note">{{ model.note }}</span>
      <span
        v-if="hasRemovableFiles && !isInstalled"
        class="app-settings-model-warning"
      >
        Partly downloaded. Delete it and start again.
      </span>
    </div>

    <div class="app-settings-model-actions">
      <BaseProgress
        v-if="isDownloading && downloadProgress !== null"
        :label="`Downloading ${model.name}`"
        :value="downloadProgress"
      />
      <BaseButton
        v-if="isDownloading"
        variant="secondary"
        @click="emit('cancel')"
      >
        Cancel
      </BaseButton>
      <template v-else>
        <span
          v-if="isInstalled"
          class="app-settings-model-selected"
        >
          In use
        </span>
        <BaseButton
          v-if="hasRemovableFiles"
          :disabled="isBusy"
          variant="secondary"
          @click="emit('delete')"
        >
          Delete
        </BaseButton>
        <BaseButton
          v-else
          :disabled="isBusy"
          @click="emit('download')"
        >
          Download
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.app-settings-model-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
  min-height: 44px;
  padding: var(--spacing-3) 0;
}

.app-settings-model-row + .app-settings-model-row {
  border-top: 1px solid var(--color-border);
}

.app-settings-model-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.app-settings-model-name {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.app-settings-model-size {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-normal);
}

.app-settings-model-note,
.app-settings-model-warning {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.app-settings-model-warning {
  color: var(--color-danger);
}

.app-settings-model-actions {
  /* Wide enough that a row does not reflow when a button is swapped for the
     progress bar mid-download. */
  --model-actions-min-width: calc(var(--spacing-20) * 2); /* 160px */

  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--spacing-2);
  min-width: var(--model-actions-min-width);
  white-space: nowrap;
}

.app-settings-model-selected {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

@media (width <= 767px) {
  .app-settings-model-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
