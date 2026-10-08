/**
 * Model files on disk, and the storage they share with the journal
 *
 * Transformers.js writes downloaded model files into a Cache storage bucket
 * on this origin — the same origin whose IndexedDB holds the entire journal.
 * Browsers evict by origin, not by importance, so a large download is also a
 * risk to the journal. That is why persistent storage is requested before the
 * first download.
 *
 * Every browser API touched here is feature-detected. A private window can be
 * missing any of them, and a missing one degrades what is shown rather than
 * being an error.
 */

import { LOCAL_INFERENCE_MODEL } from './model-registry'

import type {
  LocalInferenceModel,
  ModelInstallState,
  StorageUsage
} from '../local-inference-types'

/**
 * The bucket Transformers.js writes model files into.
 *
 * This is a library implementation detail with no public API — confirm it in
 * DevTools before assuming a version change kept it.
 */
const TRANSFORMERS_CACHE_NAME = 'transformers-cache'

/**
 * Read a browser API the type definitions describe as always present.
 *
 * `navigator.storage` and its methods are typed as mandatory, but a private
 * window or an older browser can be missing any of them. Reading through an
 * index keeps the runtime guards from being narrowed away as dead code.
 */
function readStorageManager(): Partial<StorageManager> | undefined {
  const candidate = (navigator as unknown as Record<string, unknown>)['storage']
  return typeof candidate === 'object' && candidate !== null
    ? candidate
    : undefined
}

async function openTransformersCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') {
    return null
  }
  try {
    return await caches.open(TRANSFORMERS_CACHE_NAME)
  } catch {
    return null
  }
}

function matchesModel(url: string, model: LocalInferenceModel): boolean {
  // Anchored with a trailing slash: a bare substring test would let one
  // repository whose id is a prefix of another's claim — and delete — its
  // files.
  return url.includes(`${model.repoId}/`)
}

function isWeightsFile(url: string, model: LocalInferenceModel): boolean {
  // The registry names the file outright. It is not derived from the dtype:
  // a quantised embedding build is `model_quantized.onnx`, which no
  // `model_<dtype>.onnx` pattern would ever match.
  return url.endsWith(`/${model.weightsFile}`)
}

/**
 * Read whether the model has files on disk.
 *
 * Reads only cache keys, never bodies — asking how many bytes the model
 * occupies would mean reading tens of megabytes back out.
 */
export async function readModelInstallState(): Promise<ModelInstallState> {
  const cache = await openTransformersCache()
  if (!cache) {
    return { hasAnyFiles: false, isInstalled: false }
  }

  const urls = (await cache.keys())
    .map((request) => request.url)
    .filter((url) => matchesModel(url, LOCAL_INFERENCE_MODEL))

  return {
    hasAnyFiles: urls.length > 0,
    isInstalled: urls.some((url) => isWeightsFile(url, LOCAL_INFERENCE_MODEL))
  }
}

/**
 * Delete every cached file belonging to the model.
 *
 * The caller must tear the worker down first: deleting the files while the
 * model is loaded frees no memory and leaves the engine claiming a model it
 * can no longer reload.
 */
export async function deleteModelFiles(): Promise<void> {
  const cache = await openTransformersCache()
  if (!cache) {
    return
  }

  const keys = await cache.keys()
  await Promise.all(
    keys
      .filter((request) => matchesModel(request.url, LOCAL_INFERENCE_MODEL))
      .map(async (request) => cache.delete(request))
  )
}

/**
 * Read how much of this origin's storage is in use.
 *
 * One number covers the journal, the app and every model together; the
 * browser will not break it down, and neither will this.
 */
export async function readStorageUsage(): Promise<StorageUsage | null> {
  const storage = readStorageManager()
  if (!storage?.estimate) {
    return null
  }

  try {
    const { quota, usage } = await storage.estimate()
    return {
      isPersistent: (await storage.persisted?.()) ?? false,
      quotaBytes: quota ?? 0,
      usageBytes: usage ?? 0
    }
  } catch {
    return null
  }
}

/**
 * Ask the browser to keep this origin's data.
 *
 * Called before the first download. A refusal does not block the download —
 * it changes what the person is told, since the journal and the model files
 * are evicted together or not at all.
 *
 * @returns Whether storage is persistent afterwards.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = readStorageManager()
  if (!storage?.persist) {
    return false
  }

  try {
    if (await storage.persisted?.()) {
      return true
    }
    return await storage.persist()
  } catch {
    return false
  }
}
