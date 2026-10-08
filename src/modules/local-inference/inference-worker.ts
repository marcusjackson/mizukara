/**
 * Inference Worker
 *
 * Owns the model and nothing else. It receives text and settings, and sends
 * back progress, vectors, and errors.
 *
 * It never receives a database handle. That is the design, not an omission:
 * the model cannot write to the journal because it has no way to reach it.
 *
 * Not unit-tested — it needs a real Worker, WebAssembly and a real download
 * to do anything at all. Everything in it that can be tested
 * without those lives in `utils/` instead.
 */

import { env, pipeline } from '@huggingface/transformers'

import { EMBEDDING_MODEL } from './utils/embedding-model'
import { describeFailure, readVector } from './utils/inference-reply'

import type {
  InferenceWorkerRequest,
  InferenceWorkerResponse,
  InferenceWorkerScope
} from './inference-worker-types'

// The worker's global scope, narrowed to the two things used here. See
// `InferenceWorkerScope` for why this is a cast rather than a type library.
// `globalThis` rather than `self`: under the DOM library `self` is typed as a
// Window, whose postMessage takes a different argument list.
const scope = globalThis as unknown as InferenceWorkerScope

// Model files come from the model host, never from this app's own origin.
// Left on, Transformers.js probes this origin first, and under a base path
// that returns the app's own HTML rather than a 404.
env.allowLocalModels = false

// Transformers.js sets a public CDN as the home of the ONNX runtime — a
// pre-release build, and a network request on every session that this app's
// offline promise and its privacy note both rule out. It does so while its
// module loads, so this replaces it afterwards: with nothing in it, the runtime
// finds the copy this build ships beside the worker.
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = {}
}

/** How often progress may be reported, in milliseconds. */
const PROGRESS_INTERVAL_MS = 250

interface LoadedPipeline {
  repoId: string
  extract: (text: string, options: Record<string, unknown>) => Promise<unknown>
}

let loaded: LoadedPipeline | null = null

function send(response: InferenceWorkerResponse): void {
  scope.postMessage(response)
}

/**
 * Report download progress against a denominator fixed up front.
 *
 * Transformers.js reveals each file's size only as that file starts, so a
 * running sum of per-file totals grows during the download and the percentage
 * would fall as it went. The registry's recorded weight size is used instead,
 * which only ever moves the percentage forward.
 */
function createProgressReporter(
  requestId: string,
  totalBytes: number
): (event: unknown) => void {
  const loadedPerFile = new Map<string, number>()
  let lastSentAt = 0
  let lastPercent = 0

  return (event: unknown) => {
    const { file, loaded: fileLoaded } = event as {
      file?: string
      loaded?: number
    }
    if (typeof file !== 'string' || typeof fileLoaded !== 'number') {
      return
    }

    loadedPerFile.set(file, fileLoaded)
    const total = [...loadedPerFile.values()].reduce((sum, n) => sum + n, 0)
    const percent = Math.min(99, Math.round((total / totalBytes) * 100))

    const now = Date.now()
    if (percent > lastPercent && now - lastSentAt >= PROGRESS_INTERVAL_MS) {
      lastPercent = percent
      lastSentAt = now
      send({ kind: 'progress', percent, requestId })
    }
  }
}

async function handleLoad(
  request: Extract<InferenceWorkerRequest, { kind: 'load' }>
): Promise<void> {
  if (loaded?.repoId === request.repoId) {
    send({ kind: 'loaded', requestId: request.requestId })
    return
  }

  // WebAssembly, not the graphics chip: the model is small enough for the
  // processor, and a WebGPU requirement would exclude most phones.
  const extractor = await pipeline('feature-extraction', request.repoId, {
    device: 'wasm',
    dtype: request.dtype as 'q8',
    progress_callback: createProgressReporter(
      request.requestId,
      request.totalBytes
    )
  })

  loaded = {
    extract: extractor as unknown as LoadedPipeline['extract'],
    repoId: request.repoId
  }
  send({ kind: 'loaded', requestId: request.requestId })
}

async function handleEmbed(
  request: Extract<InferenceWorkerRequest, { kind: 'embed' }>
): Promise<void> {
  if (!loaded) {
    send({
      kind: 'failed',
      message: 'No model is loaded.',
      requestId: request.requestId
    })
    return
  }

  const output = await loaded.extract(request.text, {
    normalize: EMBEDDING_MODEL.normalize,
    pooling: EMBEDDING_MODEL.pooling
  })

  send({
    kind: 'embedded',
    requestId: request.requestId,
    vector: readVector(output)
  })
}

scope.addEventListener('message', (event) => {
  const request = event.data

  const work =
    request.kind === 'load' ? handleLoad(request) : handleEmbed(request)

  work.catch((error: unknown) => {
    send({
      kind: 'failed',
      message: describeFailure(error),
      requestId: request.requestId
    })
  })
})
