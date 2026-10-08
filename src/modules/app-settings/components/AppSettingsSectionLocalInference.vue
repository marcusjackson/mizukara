<script setup lang="ts">
/**
 * AppSettingsSectionLocalInference
 *
 * The one model that powers local tag suggestions, what it costs to download,
 * and what it costs in storage. There is no on/off switch: an installed model
 * is an enabled one, and deleting it is how a person turns the feature off.
 *
 * On a device that cannot run the model this shows one line explaining why and
 * no download. A control that is present but permanently disabled is worse
 * than one that is absent.
 */

import { computed, onMounted, ref } from 'vue'

import { useLocalInferenceEngine } from '@/modules/local-inference/composables/use-local-inference-engine'
import { describeUnsupportedReason } from '@/modules/local-inference/utils/inference-support'
import { readStorageUsage } from '@/modules/local-inference/utils/model-cache-storage'
import { LOCAL_INFERENCE_MODEL } from '@/modules/local-inference/utils/model-registry'

import AppSettingsLocalInferenceModelRow from './AppSettingsLocalInferenceModelRow.vue'

import type { StorageUsage } from '@/modules/local-inference/local-inference-types'

const engine = useLocalInferenceEngine()

const storage = ref<StorageUsage | null>(null)

const isUnsupported = computed(() => engine.state.value === 'unsupported')

const isBusy = computed(
  () =>
    engine.state.value === 'downloading' ||
    engine.state.value === 'loading' ||
    engine.state.value === 'working'
)

const storageLine = computed(() => {
  if (!storage.value) {
    return 'This browser will not say how much storage is in use.'
  }
  const used = Math.round(storage.value.usageBytes / (1024 * 1024))
  const quota = Math.round(storage.value.quotaBytes / (1024 * 1024))
  const persistence = storage.value.isPersistent
    ? 'Storage is persistent, so the browser will not evict your journal to reclaim space.'
    : 'Storage is not persistent. Your journal and any downloaded models share one eviction boundary, and the browser may clear both if space runs low.'
  return `Using ${String(used)} MB of ${String(quota)} MB. ${persistence}`
})

async function refreshStorage(): Promise<void> {
  storage.value = await readStorageUsage()
}

onMounted(async () => {
  await engine.initialize()
  await refreshStorage()
})

async function handleDownload(): Promise<void> {
  await engine.downloadModel()
  await refreshStorage()
}

async function handleDelete(): Promise<void> {
  await engine.deleteModel()
  await refreshStorage()
}
</script>

<template>
  <section
    aria-label="Tag suggestion settings"
    class="app-settings-section"
  >
    <h2 class="app-settings-section-title">Tag suggestions</h2>

    <p
      v-if="isUnsupported"
      class="app-settings-unsupported"
    >
      {{
        engine.unsupportedReason.value
          ? describeUnsupportedReason(engine.unsupportedReason.value)
          : ''
      }}
      Suggestions from words already in your entry still work.
    </p>

    <template v-else>
      <p
        v-if="engine.error.value"
        class="app-settings-error"
        role="alert"
      >
        {{ engine.error.value }}
        <button
          class="app-settings-dismiss"
          type="button"
          @click="engine.dismissError"
        >
          Dismiss
        </button>
      </p>

      <div class="app-settings-models">
        <AppSettingsLocalInferenceModelRow
          :download-progress="engine.downloadProgress.value"
          :install-state="engine.installState.value"
          :is-busy="isBusy"
          :is-downloading="engine.state.value === 'downloading'"
          :model="LOCAL_INFERENCE_MODEL"
          @cancel="engine.cancelDownload"
          @delete="handleDelete"
          @download="handleDownload"
        />
      </div>

      <p class="app-settings-storage">{{ storageLine }}</p>
    </template>
  </section>
</template>

<style scoped>
.app-settings-section {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.app-settings-section-title {
  margin: 0 0 var(--spacing-lg);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.app-settings-models {
  border-top: 1px solid var(--color-border);
}

.app-settings-unsupported,
.app-settings-storage {
  margin: var(--spacing-3) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.app-settings-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-3);
  margin: var(--spacing-3) 0 0;
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.app-settings-dismiss {
  min-height: 44px;
  padding: 0 var(--spacing-2);
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  cursor: pointer;
}
</style>
