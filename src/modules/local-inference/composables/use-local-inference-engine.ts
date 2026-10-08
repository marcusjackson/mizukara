/**
 * Local Inference Engine
 *
 * The one place that owns the model's lifecycle. State lives at module scope
 * so that every caller gets the same engine: per-call state would give the
 * settings screen and the entry editor one worker each, and therefore one
 * copy of the model each.
 *
 * One engine per tab, not per app. Module scope is per-document, so a second
 * tab runs a second worker with its own copy of the model, and a delete in
 * one tab leaves the other holding files it can no longer reload.
 *
 * Nothing here throws outward. Failures land in `error` and the caller reads
 * state, following the shape of `use-device-sync-session.ts`.
 */

import { readonly } from 'vue'

import { TIMEOUTS } from '@/shared/constants/timeouts'

import { EMBEDDING_MODEL } from '../utils/embedding-model'
import { probeInferenceSupport } from '../utils/inference-support'
import { createInferenceWorkerClient } from '../utils/inference-worker-client'
import {
  deleteModelFiles,
  readModelInstallState,
  requestPersistentStorage
} from '../utils/model-cache-storage'
import { LOCAL_INFERENCE_MODEL } from '../utils/model-registry'

import {
  downloadProgress,
  error,
  fail,
  installState,
  isBusy,
  isLoaded,
  isStoragePersistent,
  restingState,
  state,
  unsupportedReason
} from './local-inference-engine-state'

import type { UseLocalInferenceEngine } from '../local-inference-types'

const client = createInferenceWorkerClient()
let initPromise: Promise<void> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Incremented by every teardown.
 *
 * Tearing the worker down rejects whatever it was doing, and that rejection
 * arrives after the teardown has already restored a resting state. Without a
 * way to tell "the worker was stopped on purpose" from "the worker failed",
 * cancelling a download reports the internal stop reason as an error.
 */
let teardownCount = 0

function clearIdleTimer(): void {
  if (idleTimer !== null) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
}

function startIdleTimer(): void {
  clearIdleTimer()
  idleTimer = setTimeout(() => {
    teardown()
  }, TIMEOUTS.INFERENCE_IDLE_TEARDOWN)
}

/**
 * Tear the worker down, freeing the memory a loaded model holds.
 *
 * Anything in flight is settled as a failure by the client, so no caller is
 * left waiting on a worker that no longer exists.
 */
function teardown(): void {
  teardownCount += 1
  clearIdleTimer()
  client.terminate('The model was unloaded.')
  isLoaded.value = false
  downloadProgress.value = null
  if (state.value !== 'error') {
    state.value = restingState()
  }
}

async function refreshInstallState(): Promise<void> {
  installState.value = await readModelInstallState()
}

/**
 * Re-read what is on disk and settle on the matching resting state.
 *
 * Something may have started during the read; resetting the state under it
 * would drop the busy guard mid-load.
 */
async function resyncWithStorage(): Promise<void> {
  await refreshInstallState()
  if (state.value !== 'error' && !isBusy()) {
    state.value = restingState()
  }
}

/**
 * Another tab may have downloaded or deleted the model while this one was in
 * the background, and each tab holds its own copy of this state.
 */
function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible' && !isBusy() && !isLoaded.value) {
    void resyncWithStorage()
  }
}

async function initialize(): Promise<void> {
  initPromise ??= (async () => {
    const unsupported = probeInferenceSupport()
    if (unsupported) {
      unsupportedReason.value = unsupported
      state.value = 'unsupported'
      return
    }
    await refreshInstallState()
    state.value = restingState()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })()

  return initPromise
}

/**
 * Load the model into memory, downloading it first if it is not already on
 * disk.
 *
 * Persistent storage is requested before any download. A refusal is reported
 * but never blocks: the download is the caller's decision, not the browser's.
 */
async function loadModel(): Promise<boolean> {
  if (isLoaded.value) {
    return true
  }

  // A model already loaded has a teardown timer running. Left alone, it can
  // fire part-way through this load and stop the worker mid-download.
  clearIdleTimer()

  const startedAt = teardownCount
  const isInstalled = installState.value.isInstalled

  // Set before the first await, not after. The busy guard callers rely on is
  // this state value, and leaving it unset across an await lets a second
  // request slip past and start a second load of the same model.
  state.value = isInstalled ? 'loading' : 'downloading'

  if (!isInstalled) {
    downloadProgress.value = 0
    isStoragePersistent.value = await requestPersistentStorage()

    // Asking the browser about storage is the first thing that yields, and a
    // cancel can land inside that window. Without this the download starts
    // anyway, after the person has already stopped it.
    if (teardownCount !== startedAt) {
      return false
    }
  }

  try {
    await client.load(LOCAL_INFERENCE_MODEL, (percent) => {
      downloadProgress.value = percent
    })
  } catch (err) {
    if (teardownCount !== startedAt) {
      // Stopped deliberately — cancelled, deleted, or timed out.
      return false
    }
    fail(err instanceof Error ? err.message : 'The model failed to load.')
    // A failed load can leave a started worker behind with no idle timer.
    teardown()
    return false
  }

  if (teardownCount !== startedAt) {
    return false
  }
  downloadProgress.value = null
  isLoaded.value = true
  await refreshInstallState()
  state.value = 'ready'
  startIdleTimer()
  return true
}

/**
 * Download the model and leave it on disk, without holding it in memory.
 *
 * Downloading and loading are the same operation — the model library has no
 * download-only call — so this loads and then immediately tears down.
 */
async function downloadModel(): Promise<void> {
  if (isBusy()) {
    error.value =
      'The model is busy with something else. Try again once it has finished.'
    return
  }
  error.value = null
  if (await loadModel()) {
    teardown()
  }
}

/** Stop a download in progress. Anything already written stays on disk. */
function cancelDownload(): void {
  if (state.value !== 'downloading') {
    return
  }
  teardown()
  // The weights may have finished writing just before the cancel.
  void refreshInstallState().then(() => {
    if (state.value !== 'error' && !isBusy()) {
      state.value = restingState()
    }
  })
}

/**
 * Delete the model's files.
 *
 * The worker is torn down first: deleting while the model is loaded frees no
 * memory and leaves the engine reporting a model it can no longer reload.
 */
async function deleteModel(): Promise<void> {
  teardown()
  await deleteModelFiles()
  await resyncWithStorage()
}

/**
 * Embed a text with the loaded model, loading it first if necessary.
 *
 * Never downloads: an uninstalled model is a decision with a size attached,
 * and it belongs on the screen that shows the size.
 *
 * @returns The vector, or null if anything went wrong — in which case
 *   `error` says what.
 */
async function embed(text: string): Promise<number[] | null> {
  if (isBusy()) {
    error.value =
      'The model is busy with something else. Try again once it has finished.'
    return null
  }
  error.value = null

  if (!isLoaded.value) {
    if (!installState.value.isInstalled) {
      error.value = 'The model has not been downloaded yet.'
      return null
    }
    if (!(await loadModel())) {
      return null
    }
  }

  const startedAt = teardownCount
  clearIdleTimer()
  state.value = 'working'
  try {
    const vector = await client.embed(text)
    state.value = 'ready'
    startIdleTimer()
    if (vector.length !== EMBEDDING_MODEL.dimensions) {
      // The head would throw on it, or worse, score the wrong thing.
      error.value = 'The model returned an unusable result.'
      return null
    }
    return vector
  } catch (err) {
    if (teardownCount !== startedAt) {
      return null
    }
    fail(err instanceof Error ? err.message : 'Embedding failed.')
    // Otherwise the model stays resident with no idle timer to free it.
    teardown()
    return null
  }
}

function dismissError(): void {
  error.value = null
  state.value = restingState()
}

/** The single engine, shared by every caller in this tab. */
export function useLocalInferenceEngine(): UseLocalInferenceEngine {
  return {
    cancelDownload,
    deleteModel,
    dismissError,
    downloadModel,
    downloadProgress: readonly(downloadProgress),
    embed,
    error: readonly(error),
    initialize,
    installState: readonly(installState),
    isStoragePersistent: readonly(isStoragePersistent),
    state: readonly(state),
    teardown,
    unsupportedReason: readonly(unsupportedReason)
  }
}
