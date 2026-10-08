import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  deleteModelFiles,
  readModelInstallState,
  readStorageUsage,
  requestPersistentStorage
} from './model-cache-storage'
import { LOCAL_INFERENCE_MODEL } from './model-registry'

const MODEL = LOCAL_INFERENCE_MODEL

/** A different repository whose id this one's is a prefix of. */
const NEIGHBOUR = `${MODEL.repoId}-large`

/** An in-memory stand-in for the one Cache the app reads. */
class FakeCache {
  constructor(public urls: string[]) {}

  keys(): Promise<{ url: string }[]> {
    return Promise.resolve(this.urls.map((url) => ({ url })))
  }

  delete(request: { url: string }): Promise<boolean> {
    const before = this.urls.length
    this.urls = this.urls.filter((url) => url !== request.url)
    return Promise.resolve(this.urls.length < before)
  }
}

function stubCaches(cache: FakeCache | null): void {
  vi.stubGlobal(
    'caches',
    cache === null
      ? { open: vi.fn().mockRejectedValue(new Error('unavailable')) }
      : { open: vi.fn().mockResolvedValue(cache) }
  )
}

function stubStorage(storage: unknown): void {
  Object.defineProperty(globalThis.navigator, 'storage', {
    configurable: true,
    value: storage,
    writable: true
  })
}

function weightsUrl(repoId: string): string {
  return `https://huggingface.co/${repoId}/resolve/main/onnx/${MODEL.weightsFile}`
}

function tokenizerUrl(repoId: string): string {
  return `https://huggingface.co/${repoId}/resolve/main/tokenizer.json`
}

describe('model cache storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(globalThis.navigator, 'storage')
  })

  describe('readModelInstallState', () => {
    it('should report the model installed when its weights file is cached', async () => {
      stubCaches(
        new FakeCache([weightsUrl(MODEL.repoId), tokenizerUrl(MODEL.repoId)])
      )

      expect(await readModelInstallState()).toEqual({
        hasAnyFiles: true,
        isInstalled: true
      })
    })

    it('should recognise a quantised build, whose filename is not model_<dtype>.onnx', async () => {
      stubCaches(new FakeCache([weightsUrl(MODEL.repoId)]))

      expect((await readModelInstallState()).isInstalled).toBe(true)
    })

    it('should not take another dtype build of the same repository for the weights', async () => {
      stubCaches(
        new FakeCache([
          `https://huggingface.co/${MODEL.repoId}/resolve/main/onnx/model_fp16.onnx`
        ])
      )

      expect(await readModelInstallState()).toEqual({
        hasAnyFiles: true,
        isInstalled: false
      })
    })

    it('should report a partial install when only a support file is cached', async () => {
      stubCaches(new FakeCache([tokenizerUrl(MODEL.repoId)]))

      expect(await readModelInstallState()).toEqual({
        hasAnyFiles: true,
        isInstalled: false
      })
    })

    it('should report nothing installed when Cache storage is unavailable', async () => {
      vi.stubGlobal('caches', undefined)

      expect((await readModelInstallState()).hasAnyFiles).toBe(false)
    })

    it('should report nothing installed when opening the cache throws', async () => {
      stubCaches(null)

      expect(await readModelInstallState()).toEqual({
        hasAnyFiles: false,
        isInstalled: false
      })
    })
  })

  describe('deleteModelFiles', () => {
    it('should remove only the model files when a neighbouring repository is cached', async () => {
      const cache = new FakeCache([
        weightsUrl(MODEL.repoId),
        tokenizerUrl(MODEL.repoId),
        weightsUrl(NEIGHBOUR)
      ])
      stubCaches(cache)

      await deleteModelFiles()

      expect(cache.urls).toEqual([weightsUrl(NEIGHBOUR)])
    })

    it('should not throw when Cache storage is unavailable', async () => {
      vi.stubGlobal('caches', undefined)

      await expect(deleteModelFiles()).resolves.toBeUndefined()
    })
  })

  describe('readStorageUsage', () => {
    it('should report usage and persistence when the browser supports estimates', async () => {
      stubStorage({
        estimate: vi.fn().mockResolvedValue({ quota: 2000, usage: 500 }),
        persisted: vi.fn().mockResolvedValue(true)
      })

      expect(await readStorageUsage()).toEqual({
        isPersistent: true,
        quotaBytes: 2000,
        usageBytes: 500
      })
    })

    it('should return null when the browser cannot estimate storage', async () => {
      stubStorage(undefined)

      expect(await readStorageUsage()).toBeNull()
    })

    it('should return null when estimating throws', async () => {
      stubStorage({
        estimate: vi.fn().mockRejectedValue(new Error('denied')),
        persisted: vi.fn()
      })

      expect(await readStorageUsage()).toBeNull()
    })
  })

  describe('requestPersistentStorage', () => {
    it('should not ask again when storage is already persistent', async () => {
      const persist = vi.fn()
      stubStorage({ persist, persisted: vi.fn().mockResolvedValue(true) })

      expect(await requestPersistentStorage()).toBe(true)
      expect(persist).not.toHaveBeenCalled()
    })

    it('should report the browser answer when storage is not yet persistent', async () => {
      stubStorage({
        persist: vi.fn().mockResolvedValue(false),
        persisted: vi.fn().mockResolvedValue(false)
      })

      expect(await requestPersistentStorage()).toBe(false)
    })

    it('should report not persistent when the browser has no persist support', async () => {
      stubStorage(undefined)

      expect(await requestPersistentStorage()).toBe(false)
    })
  })
})
