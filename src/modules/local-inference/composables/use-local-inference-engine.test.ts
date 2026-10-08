import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMBEDDING_MODEL } from '../utils/embedding-model'

import type {
  ModelInstallState,
  UseLocalInferenceEngine
} from '../local-inference-types'
import type { InferenceWorkerClient } from '../utils/inference-worker-client'

const load = vi.fn<InferenceWorkerClient['load']>()
const embed = vi.fn<InferenceWorkerClient['embed']>()
const terminate = vi.fn<InferenceWorkerClient['terminate']>()
const probeInferenceSupport = vi.fn<() => string | null>()
const readModelInstallState = vi.fn<() => Promise<ModelInstallState>>()
const deleteModelFiles = vi.fn<() => Promise<void>>()
const requestPersistentStorage = vi.fn<() => Promise<boolean>>()

vi.mock('../utils/inference-worker-client', () => ({
  createInferenceWorkerClient: () => ({
    embed,
    isRunning: () => false,
    load,
    terminate
  })
}))

/**
 * Make load hang until released, and make terminate reject it the way the
 * real client does. Without that rejection the tests cannot see the bug where
 * a deliberate teardown is reported to the person as a failure.
 */
function hangingLoad(): { release: () => void } {
  let rejectLoad: (error: Error) => void = () => undefined
  load.mockImplementation(
    () =>
      new Promise<void>((_resolve, reject) => {
        rejectLoad = reject
      })
  )
  terminate.mockImplementation(() => {
    rejectLoad(new Error('The model was unloaded.'))
  })
  return {
    release: () => {
      rejectLoad(new Error('The model was unloaded.'))
    }
  }
}

vi.mock('../utils/inference-support', () => ({
  describeUnsupportedReason: () => 'unsupported',
  probeInferenceSupport: () => probeInferenceSupport()
}))

vi.mock('../utils/model-cache-storage', () => ({
  deleteModelFiles: () => deleteModelFiles(),
  readModelInstallState: () => readModelInstallState(),
  readStorageUsage: () => Promise.resolve(null),
  requestPersistentStorage: () => requestPersistentStorage()
}))

const VECTOR = Array.from({ length: EMBEDDING_MODEL.dimensions }, () => 0.1)

function installState(
  installed: boolean,
  hasAnyFiles = installed
): ModelInstallState {
  return { hasAnyFiles, isInstalled: installed }
}

async function loadEngine(): Promise<UseLocalInferenceEngine> {
  const module = await import('./use-local-inference-engine')
  return module.useLocalInferenceEngine()
}

describe('useLocalInferenceEngine', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    probeInferenceSupport.mockReturnValue(null)
    readModelInstallState.mockResolvedValue(installState(false))
    requestPersistentStorage.mockResolvedValue(true)
    load.mockResolvedValue(undefined)
    embed.mockResolvedValue(VECTOR)
    deleteModelFiles.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should report unsupported when the device cannot run a worker', async () => {
    probeInferenceSupport.mockReturnValue('no-worker')
    const engine = await loadEngine()

    await engine.initialize()

    expect(engine.state.value).toBe('unsupported')
    expect(engine.unsupportedReason.value).toBe('no-worker')
  })

  it('should report no model when nothing has been downloaded', async () => {
    const engine = await loadEngine()

    await engine.initialize()

    expect(engine.state.value).toBe('no-model')
  })

  it('should report idle when a model is already on disk', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()

    await engine.initialize()

    expect(engine.state.value).toBe('idle')
  })

  it('should probe the device only once across repeated initialization', async () => {
    const engine = await loadEngine()

    await engine.initialize()
    await engine.initialize()

    expect(probeInferenceSupport).toHaveBeenCalledTimes(1)
  })

  it('should ask for persistent storage before a first download', async () => {
    const engine = await loadEngine()
    await engine.initialize()
    readModelInstallState.mockResolvedValue(installState(true))

    await engine.downloadModel()

    expect(requestPersistentStorage).toHaveBeenCalledTimes(1)
    expect(engine.isStoragePersistent.value).toBe(true)
  })

  it('should free the memory once a settings-initiated download finishes', async () => {
    const engine = await loadEngine()
    await engine.initialize()
    readModelInstallState.mockResolvedValue(installState(true))

    await engine.downloadModel()

    expect(terminate).toHaveBeenCalled()
    expect(engine.state.value).toBe('idle')
  })

  it('should surface the download percentage while a download runs', async () => {
    const engine = await loadEngine()
    await engine.initialize()
    const seen: (number | null)[] = []
    load.mockImplementation((_model, onProgress) => {
      onProgress(35)
      seen.push(engine.downloadProgress.value)
      return Promise.resolve()
    })

    await engine.downloadModel()

    expect(seen).toEqual([35])
  })

  it('should return the vector and land ready when embedding succeeds', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()
    await engine.initialize()

    const vector = await engine.embed('Entry')

    expect(vector).toEqual(VECTOR)
    expect(engine.state.value).toBe('ready')
  })

  it('should return null and record the error when embedding fails', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    embed.mockRejectedValue(new Error('out of memory'))
    const engine = await loadEngine()
    await engine.initialize()

    const vector = await engine.embed('Entry')

    expect(vector).toBeNull()
    expect(engine.state.value).toBe('error')
    expect(engine.error.value).toBe('out of memory')
  })

  it('should leave the error state when the error is dismissed', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    embed.mockRejectedValue(new Error('out of memory'))
    const engine = await loadEngine()
    await engine.initialize()
    await engine.embed('Entry')

    engine.dismissError()

    expect(engine.state.value).toBe('idle')
    expect(engine.error.value).toBeNull()
  })

  it('should tear the worker down after the idle period elapses', async () => {
    vi.useFakeTimers()
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()
    await engine.initialize()
    await engine.embed('Entry')
    terminate.mockClear()

    vi.advanceTimersByTime(120000)

    expect(terminate).toHaveBeenCalledTimes(1)
    expect(engine.state.value).toBe('idle')
  })

  it('should keep the model loaded while it is still being used', async () => {
    vi.useFakeTimers()
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()
    await engine.initialize()
    await engine.embed('Entry')
    terminate.mockClear()

    vi.advanceTimersByTime(119000)

    expect(terminate).not.toHaveBeenCalled()
    expect(engine.state.value).toBe('ready')
  })

  it('should tear the worker down before deleting a model file', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()
    await engine.initialize()
    const order: string[] = []
    terminate.mockImplementation(() => order.push('terminate'))
    deleteModelFiles.mockImplementation(() => {
      order.push('delete')
      return Promise.resolve()
    })
    readModelInstallState.mockResolvedValue(installState(false))

    await engine.deleteModel()

    expect(order).toEqual(['terminate', 'delete'])
    expect(engine.state.value).toBe('no-model')
  })

  describe('when the tab comes back to the foreground', () => {
    // Engines from earlier tests keep their listeners on the shared document,
    // so wait for a read beyond the count already made rather than for an exact one.
    function showTab(): Promise<void> {
      const readsBefore = readModelInstallState.mock.calls.length
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible'
      })
      document.dispatchEvent(new Event('visibilitychange'))
      return vi.waitFor(() => {
        expect(readModelInstallState.mock.calls.length).toBeGreaterThan(
          readsBefore
        )
      })
    }

    it('should notice a model another tab deleted', async () => {
      readModelInstallState.mockResolvedValue(installState(true))
      const engine = await loadEngine()
      await engine.initialize()
      expect(engine.state.value).toBe('idle')

      readModelInstallState.mockResolvedValue(installState(false))
      await showTab()

      await vi.waitFor(() => {
        expect(engine.state.value).toBe('no-model')
      })
      expect(engine.installState.value.isInstalled).toBe(false)
    })

    it('should notice a model another tab downloaded', async () => {
      const engine = await loadEngine()
      await engine.initialize()
      expect(engine.state.value).toBe('no-model')

      readModelInstallState.mockResolvedValue(installState(true))
      await showTab()

      await vi.waitFor(() => {
        expect(engine.state.value).toBe('idle')
      })
    })
  })

  it('should share one engine between callers, so only one model is ever loaded', async () => {
    const module = await import('./use-local-inference-engine')
    const first = module.useLocalInferenceEngine()
    const second = module.useLocalInferenceEngine()

    await first.initialize()
    await second.initialize()

    expect(probeInferenceSupport).toHaveBeenCalledTimes(1)
    expect(second.state.value).toBe(first.state.value)
  })

  it('should refuse to start a second operation while one is running', async () => {
    const engine = await loadEngine()
    await engine.initialize()
    let release: () => void = () => {
      throw new Error('load was never called')
    }
    load.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        })
    )

    const first = engine.downloadModel()
    await engine.downloadModel()
    release()
    await first

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('should return quietly to rest when a download is cancelled', async () => {
    const engine = await loadEngine()
    await engine.initialize()
    hangingLoad()

    const download = engine.downloadModel()
    engine.cancelDownload()
    await download

    expect(engine.state.value).toBe('no-model')
    expect(engine.error.value).toBeNull()
  })

  it('should return quietly to rest when the feature is switched off mid-download', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()
    await engine.initialize()
    hangingLoad()

    const download = engine.downloadModel()
    engine.teardown()
    await download

    expect(engine.state.value).toBe('idle')
    expect(engine.error.value).toBeNull()
  })

  it('should say the engine is busy rather than nothing when asked twice', async () => {
    const engine = await loadEngine()
    await engine.initialize()
    hangingLoad()

    const first = engine.downloadModel()
    const vector = await engine.embed('Entry')
    engine.teardown()
    await first

    expect(vector).toBeNull()
    expect(engine.error.value).toContain('busy')
  })

  it('should free the worker after an embedding failure, since no idle timer is left', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    embed.mockRejectedValue(new Error('out of memory'))
    const engine = await loadEngine()
    await engine.initialize()
    terminate.mockClear()

    await engine.embed('Entry')

    expect(terminate).toHaveBeenCalledTimes(1)
    expect(engine.state.value).toBe('error')
  })

  it('should free the worker after a failed load', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    load.mockRejectedValue(new Error('bad weights'))
    const engine = await loadEngine()
    await engine.initialize()
    terminate.mockClear()

    await engine.embed('Entry')

    expect(terminate).toHaveBeenCalledTimes(1)
    expect(engine.error.value).toBe('bad weights')
  })

  it('should not reset the state under an operation that started while deleting', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()
    await engine.initialize()
    let finishDelete: () => void = () => undefined
    deleteModelFiles.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishDelete = resolve
        })
    )
    hangingLoad()

    const deleting = engine.deleteModel()
    const embedding = engine.embed('Entry')
    await Promise.resolve()
    expect(engine.state.value).toBe('loading')
    finishDelete()
    await deleting

    expect(engine.state.value).toBe('loading')
    engine.teardown()
    await embedding
  })

  it('should not download when asked to embed with no model installed', async () => {
    const engine = await loadEngine()
    await engine.initialize()

    const vector = await engine.embed('Entry')

    expect(vector).toBeNull()
    expect(load).not.toHaveBeenCalled()
    expect(engine.error.value).toContain('not been downloaded')
  })

  it('should reject a vector that is not the width the head expects', async () => {
    readModelInstallState.mockResolvedValue(installState(true))
    embed.mockResolvedValue([])
    const engine = await loadEngine()
    await engine.initialize()

    expect(await engine.embed('Entry')).toBeNull()
    expect(engine.error.value).toContain('unusable')
  })

  it('should not let a stale idle timer break a later download', async () => {
    vi.useFakeTimers()
    readModelInstallState.mockResolvedValue(installState(true))
    const engine = await loadEngine()
    await engine.initialize()
    await engine.embed('Entry')

    const download = engine.downloadModel()
    vi.advanceTimersByTime(150000)
    await download

    expect(engine.state.value).toBe('idle')
    expect(engine.error.value).toBeNull()
  })
})
