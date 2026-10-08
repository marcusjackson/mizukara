/**
 * Local Inference Engine State
 *
 * The engine's reactive state, kept separate from the operations that drive
 * it so that neither file has to be read to understand the other. Module
 * scope is the point: every caller shares one engine, because per-caller
 * state would mean one worker and one copy of the model each.
 */

import { ref } from 'vue'

import type {
  LocalInferenceState,
  LocalInferenceUnsupportedReason,
  ModelInstallState
} from '../local-inference-types'

export const state = ref<LocalInferenceState>('no-model')
export const error = ref<string | null>(null)
export const unsupportedReason = ref<LocalInferenceUnsupportedReason | null>(
  null
)
export const installState = ref<ModelInstallState>({
  hasAnyFiles: false,
  isInstalled: false
})
export const downloadProgress = ref<number | null>(null)
export const isStoragePersistent = ref<boolean | null>(null)
export const isLoaded = ref(false)

/** True while an operation the engine must not overlap is in flight. */
export function isBusy(): boolean {
  return (
    state.value === 'downloading' ||
    state.value === 'loading' ||
    state.value === 'working'
  )
}

/** The state to fall back to once nothing is loaded and nothing has failed. */
export function restingState(): LocalInferenceState {
  if (unsupportedReason.value) {
    return 'unsupported'
  }
  return installState.value.isInstalled ? 'idle' : 'no-model'
}

/** Record a failure the person can read, and stop reporting progress. */
export function fail(message: string): void {
  error.value = message
  state.value = 'error'
  downloadProgress.value = null
}
