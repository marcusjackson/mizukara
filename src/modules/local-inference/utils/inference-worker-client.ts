/**
 * Inference Worker Client
 *
 * Owns the worker handle and the correlation between a request and its reply.
 * Knows nothing about what state the engine is in — that is the engine's job.
 *
 * The one rule worth stating: **terminating settles every request in flight.**
 * The worker is torn down on an idle timeout, on a delete, on a cancel and on
 * switching the feature off, and a request left unsettled by any of those is a
 * promise that never resolves and a button that spins forever.
 */

import { TIMEOUTS } from '@/shared/constants/timeouts'
import { generateUUID } from '@/shared/utils/uuid-utils'

import { EMBEDDING_MODEL } from './embedding-model'

import type {
  InferenceWorkerRequest,
  InferenceWorkerResponse
} from '../inference-worker-types'
import type { LocalInferenceModel } from '../local-inference-types'

/** Minimal worker surface, so tests can supply one without a real Worker. */
export interface InferenceWorkerHandle {
  postMessage: (request: InferenceWorkerRequest) => void
  terminate: () => void
  addEventListener(
    type: 'message',
    listener: (event: { data: InferenceWorkerResponse }) => void
  ): void
  addEventListener(type: 'error', listener: () => void): void
}

export interface InferenceWorkerClient {
  load: (
    model: LocalInferenceModel,
    onProgress: (percent: number) => void
  ) => Promise<void>
  /** Embed one text, returning its vector. */
  embed: (text: string) => Promise<number[]>
  /** Tear the worker down, settling anything in flight as a failure. */
  terminate: (reason: string) => void
  isRunning: () => boolean
}

interface PendingRequest {
  resolve: (vector: number[]) => void
  reject: (error: Error) => void
  onProgress: ((percent: number) => void) | undefined
}

function createDefaultWorker(): InferenceWorkerHandle {
  return new Worker(new URL('../inference-worker.ts', import.meta.url), {
    type: 'module'
  })
}

class WorkerClient implements InferenceWorkerClient {
  private worker: InferenceWorkerHandle | null = null
  private readonly pending = new Map<string, PendingRequest>()

  constructor(private readonly createWorker: () => InferenceWorkerHandle) {}

  isRunning(): boolean {
    return this.worker !== null
  }

  async load(
    model: LocalInferenceModel,
    onProgress: (percent: number) => void
  ): Promise<void> {
    await this.send(
      {
        dtype: model.dtype,
        kind: 'load',
        repoId: model.repoId,
        requestId: generateUUID(),
        totalBytes: model.downloadBytes
      },
      onProgress
    )
  }

  async embed(text: string): Promise<number[]> {
    // A worker that never replies would leave this pending forever, so one
    // that stays silent is torn down, which settles the request as a failure.
    const timer = setTimeout(() => {
      this.settleAll('The model took too long to respond.')
    }, TIMEOUTS.INFERENCE_EMBED)
    try {
      return await this.send({
        kind: 'embed',
        requestId: generateUUID(),
        text: EMBEDDING_MODEL.prefix + text
      })
    } finally {
      clearTimeout(timer)
    }
  }

  terminate(reason: string): void {
    this.settleAll(reason)
  }

  private settleAll(reason: string): void {
    for (const request of this.pending.values()) {
      request.reject(new Error(reason))
    }
    this.pending.clear()

    this.worker?.terminate()
    this.worker = null
  }

  private send(
    request: InferenceWorkerRequest,
    onProgress?: (percent: number) => void
  ): Promise<number[]> {
    return new Promise<number[]>((resolve, reject) => {
      this.pending.set(request.requestId, { onProgress, reject, resolve })
      this.ensureWorker().postMessage(request)
    })
  }

  private ensureWorker(): InferenceWorkerHandle {
    this.worker ??= this.startWorker()
    return this.worker
  }

  private startWorker(): InferenceWorkerHandle {
    const worker = this.createWorker()
    worker.addEventListener('message', (event) => {
      this.handleResponse(event.data)
    })
    // A worker whose script fails to load, or that throws outside a handler,
    // never replies; without this its requests would never settle.
    worker.addEventListener('error', () => {
      this.settleAll('The model could not be started in the background.')
    })
    return worker
  }

  private handleResponse(response: InferenceWorkerResponse): void {
    const request = this.pending.get(response.requestId)
    if (!request) {
      return
    }

    if (response.kind === 'progress') {
      request.onProgress?.(response.percent)
      return
    }

    this.pending.delete(response.requestId)
    if (response.kind === 'failed') {
      request.reject(new Error(response.message))
    } else {
      request.resolve(response.kind === 'embedded' ? response.vector : [])
    }
  }
}

/**
 * Create a client over a lazily started worker.
 *
 * @param createWorker - How to start the worker. Overridden in tests, where
 *   there is no Worker constructor and no model to load.
 */
export function createInferenceWorkerClient(
  createWorker: () => InferenceWorkerHandle = createDefaultWorker
): InferenceWorkerClient {
  return new WorkerClient(createWorker)
}
