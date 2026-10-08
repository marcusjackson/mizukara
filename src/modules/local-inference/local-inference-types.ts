/**
 * Local Inference Types
 *
 * Shared vocabulary for the on-device model: what can be run, what state the
 * engine is in, and why a device might not be able to run any of it.
 */

import type { DeepReadonly, Ref } from 'vue'

/**
 * The one downloadable model.
 *
 * What it is and how it must be run is `EMBEDDING_MODEL`'s business; this
 * holds only what the Settings screen and the download need.
 */
export interface LocalInferenceModel {
  /** Repository on the model host. */
  repoId: string
  /** Transformers.js dtype name that selects the weights file. */
  dtype: string
  /** The weights file whose presence means the model is installed. */
  weightsFile: string
  /** Name shown in settings. */
  name: string
  /**
   * Size of the model weights in bytes.
   *
   * Used for the download progress denominator as well as for display. The
   * tokenizer and config files add a few megabytes on top, so progress
   * reaches 100% marginally early rather than late.
   */
  downloadBytes: number
  /** One line on what the model is for. */
  note: string
}

/** Why a device cannot run local inference at all. */
export type LocalInferenceUnsupportedReason = 'no-worker' | 'no-webassembly'

/**
 * What the engine is doing.
 *
 * `idle` and `ready` are easy to read backwards. `idle` means the model's
 * files are on disk with no worker running and no memory held; `ready` means
 * the model is loaded into memory. Tearing down after an idle period
 * therefore moves `ready` to `idle`.
 */
export type LocalInferenceState =
  | 'unsupported'
  | 'no-model'
  | 'downloading'
  | 'loading'
  | 'idle'
  | 'ready'
  | 'working'
  | 'error'

/** Whether a model's files are on disk, and whether they are all there. */
export interface ModelInstallState {
  /** The weights file is present, so the model is expected to load. */
  isInstalled: boolean
  /**
   * Some files for this model are present.
   *
   * Cache writes are per-file, so a cancelled or killed download leaves a
   * partial install behind. Deletion is offered whenever this is true, not
   * only when the model reports installed — otherwise a half-downloaded model
   * can be neither used nor removed.
   */
  hasAnyFiles: boolean
}

/** How much of the origin's storage is used, when the browser will say. */
export interface StorageUsage {
  usageBytes: number
  quotaBytes: number
  isPersistent: boolean
}

/** One suggested tag. Always a tag the person already has. */
export interface TagSuggestion {
  tagId: string
  name: string
}

/** The public surface of the shared inference engine. */
export interface UseLocalInferenceEngine {
  state: DeepReadonly<Ref<LocalInferenceState>>
  error: DeepReadonly<Ref<string | null>>
  unsupportedReason: DeepReadonly<Ref<LocalInferenceUnsupportedReason | null>>
  /** What is on disk, including a partial download. */
  installState: DeepReadonly<Ref<ModelInstallState>>
  /** Download completion from 0 to 100, or null when nothing is downloading. */
  downloadProgress: DeepReadonly<Ref<number | null>>
  /** Whether persistent storage was granted, once it has been asked for. */
  isStoragePersistent: DeepReadonly<Ref<boolean | null>>
  initialize: () => Promise<void>
  downloadModel: () => Promise<void>
  cancelDownload: () => void
  deleteModel: () => Promise<void>
  /**
   * Embed one text, loading the model first if it is installed but not loaded.
   *
   * @returns The unit-length vector, or null if anything went wrong — in which
   *   case `error` says what. Never downloads: an uninstalled model is null.
   */
  embed: (text: string) => Promise<number[] | null>
  dismissError: () => void
  teardown: () => void
}
