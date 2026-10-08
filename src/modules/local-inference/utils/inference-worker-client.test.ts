import { describe, expect, it, vi } from 'vitest'

import { TIMEOUTS } from '@/shared/constants/timeouts'

import { EMBEDDING_MODEL } from './embedding-model'
import {
  createInferenceWorkerClient,
  type InferenceWorkerHandle
} from './inference-worker-client'
import { LOCAL_INFERENCE_MODEL } from './model-registry'

import type {
  InferenceWorkerRequest,
  InferenceWorkerResponse
} from '../inference-worker-types'

/**
 * A response minus its correlation id, distributed across the union so each
 * variant keeps its own fields. A bare Omit would collapse them to the one
 * property they share.
 */
type ResponseBody<T = InferenceWorkerResponse> =
  T extends InferenceWorkerResponse ? Omit<T, 'requestId'> : never

const MODEL = LOCAL_INFERENCE_MODEL

/** A worker that records what it was sent and replies only when told to. */
class FakeWorker implements InferenceWorkerHandle {
  readonly sent: InferenceWorkerRequest[] = []
  readonly terminate = vi.fn()
  private errorListener: (() => void) | null = null
  private listener:
    ((event: { data: InferenceWorkerResponse }) => void) | null = null

  postMessage(request: InferenceWorkerRequest): void {
    this.sent.push(request)
  }

  addEventListener(
    type: 'message',
    listener: (event: { data: InferenceWorkerResponse }) => void
  ): void
  addEventListener(type: 'error', listener: () => void): void
  addEventListener(
    type: 'message' | 'error',
    listener: ((event: { data: InferenceWorkerResponse }) => void) &
      (() => void)
  ): void {
    if (type === 'error') {
      this.errorListener = listener
    } else {
      this.listener = listener
    }
  }

  /** Simulate the worker failing to start or throwing outside a handler. */
  crash(): void {
    this.errorListener?.()
  }

  /** Reply to the request at `index`, defaulting to the most recent. */
  reply(response: ResponseBody, index = this.sent.length - 1): void {
    const requestId = this.sent[index]?.requestId ?? 'unknown'
    this.listener?.({
      data: { ...response, requestId }
    })
  }
}

function setup(): {
  client: ReturnType<typeof createInferenceWorkerClient>
  worker: FakeWorker
} {
  const worker = new FakeWorker()
  return { client: createInferenceWorkerClient(() => worker), worker }
}

describe('createInferenceWorkerClient', () => {
  it('should not start a worker until something is asked of it', () => {
    const createWorker = vi.fn(() => new FakeWorker())
    createInferenceWorkerClient(createWorker)

    expect(createWorker).not.toHaveBeenCalled()
  })

  it('should start exactly one worker across several requests', async () => {
    const worker = new FakeWorker()
    const createWorker = vi.fn(() => worker)
    const client = createInferenceWorkerClient(createWorker)

    const load = client.load(MODEL, vi.fn())
    worker.reply({ kind: 'loaded' })
    await load

    const embed = client.embed('Entry')
    worker.reply({ kind: 'embedded', vector: [1] })
    await embed

    expect(createWorker).toHaveBeenCalledTimes(1)
  })

  it('should send the registry download size as the progress denominator', async () => {
    const { client, worker } = setup()

    const load = client.load(MODEL, vi.fn())
    worker.reply({ kind: 'loaded' })
    await load

    expect(worker.sent[0]).toMatchObject({
      dtype: MODEL.dtype,
      kind: 'load',
      repoId: MODEL.repoId,
      totalBytes: MODEL.downloadBytes
    })
  })

  it('should forward progress to the caller while a load is in flight', async () => {
    const { client, worker } = setup()
    const onProgress = vi.fn()

    const load = client.load(MODEL, onProgress)
    worker.reply({ kind: 'progress', percent: 30 })
    worker.reply({ kind: 'progress', percent: 70 })
    worker.reply({ kind: 'loaded' })
    await load

    expect(onProgress.mock.calls).toEqual([[30], [70]])
  })

  it('should resolve with the vector when the worker replies', async () => {
    const { client, worker } = setup()

    const embed = client.embed('Entry')
    worker.reply({ kind: 'embedded', vector: [0.5, 0.25] })

    await expect(embed).resolves.toEqual([0.5, 0.25])
  })

  it('should prepend the configured prefix to the text sent', async () => {
    const { client, worker } = setup()

    const embed = client.embed('Entry')
    worker.reply({ kind: 'embedded', vector: [1] })
    await embed

    expect(worker.sent[0]).toMatchObject({
      kind: 'embed',
      text: `${EMBEDDING_MODEL.prefix}Entry`
    })
  })

  it('should settle requests in flight when the worker itself fails', async () => {
    const { client, worker } = setup()

    const embed = client.embed('Entry')
    worker.crash()

    await expect(embed).rejects.toThrow('could not be started')
    expect(worker.terminate).toHaveBeenCalledTimes(1)
  })

  it('should reject with the worker message when the worker reports failure', async () => {
    const { client, worker } = setup()

    const embed = client.embed('Entry')
    worker.reply({ kind: 'failed', message: 'out of memory' })

    await expect(embed).rejects.toThrow('out of memory')
  })

  it('should give up on an embed the worker never answers', async () => {
    vi.useFakeTimers()
    try {
      const worker = new FakeWorker()
      const client = createInferenceWorkerClient(() => worker)

      const pending = client.embed('hello')
      const outcome = pending.catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(TIMEOUTS.INFERENCE_EMBED)

      expect(await outcome).toEqual(
        new Error('The model took too long to respond.')
      )
      expect(worker.terminate).toHaveBeenCalledTimes(1)
      expect(client.isRunning()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('should not time out an embed the worker already answered', async () => {
    vi.useFakeTimers()
    try {
      const worker = new FakeWorker()
      const client = createInferenceWorkerClient(() => worker)

      const embed = client.embed('hello')
      worker.reply({ kind: 'embedded', vector: [1] })
      await expect(embed).resolves.toEqual([1])
      await vi.advanceTimersByTimeAsync(TIMEOUTS.INFERENCE_EMBED)

      expect(vi.getTimerCount()).toBe(0)
      expect(worker.terminate).not.toHaveBeenCalled()
      expect(client.isRunning()).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('should settle every request in flight when terminated', async () => {
    const { client, worker } = setup()

    const load = client.load(MODEL, vi.fn())
    const embed = client.embed('Entry')
    client.terminate('Stopped')

    await expect(load).rejects.toThrow('Stopped')
    await expect(embed).rejects.toThrow('Stopped')
    expect(worker.terminate).toHaveBeenCalledTimes(1)
  })

  it('should start a fresh worker after being terminated', () => {
    const createWorker = vi.fn(() => new FakeWorker())
    const client = createInferenceWorkerClient(createWorker)

    void client.embed('Entry').catch(() => {
      // Rejected by the terminate below; the rejection is asserted elsewhere.
    })
    client.terminate('Stopped')
    void client.embed('Entry').catch(() => {
      // Left pending for the lifetime of the test.
    })

    expect(createWorker).toHaveBeenCalledTimes(2)
  })

  it('should report whether a worker is running', () => {
    const { client } = setup()

    expect(client.isRunning()).toBe(false)
    void client.embed('Entry').catch(() => {
      // Left pending for the lifetime of the test.
    })
    expect(client.isRunning()).toBe(true)

    client.terminate('Stopped')
    expect(client.isRunning()).toBe(false)
  })

  it('should ignore a reply that matches no pending request', async () => {
    const { client, worker } = setup()

    const embed = client.embed('Entry')
    worker.reply({ kind: 'embedded', vector: [1] })
    worker.reply({ kind: 'embedded', vector: [2] })

    await expect(embed).resolves.toEqual([1])
  })
})
