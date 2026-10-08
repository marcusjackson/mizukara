import { beforeEach, describe, expect, it } from 'vitest'

import {
  downloadProgress,
  error,
  fail,
  installState,
  isBusy,
  restingState,
  state,
  unsupportedReason
} from './local-inference-engine-state'

describe('local inference engine state', () => {
  beforeEach(() => {
    state.value = 'no-model'
    error.value = null
    unsupportedReason.value = null
    installState.value = { hasAnyFiles: false, isInstalled: false }
    downloadProgress.value = null
  })

  describe('isBusy', () => {
    it('should be busy while downloading, loading or working', () => {
      for (const busy of ['downloading', 'loading', 'working'] as const) {
        state.value = busy
        expect(isBusy()).toBe(true)
      }
    })

    it('should not be busy at rest', () => {
      for (const resting of ['no-model', 'idle', 'ready', 'error'] as const) {
        state.value = resting
        expect(isBusy()).toBe(false)
      }
    })
  })

  describe('restingState', () => {
    it('should rest at unsupported when the device cannot run the model', () => {
      unsupportedReason.value = 'no-worker'
      installState.value = { hasAnyFiles: true, isInstalled: true }

      expect(restingState()).toBe('unsupported')
    })

    it('should rest at idle when the model is on disk', () => {
      installState.value = { hasAnyFiles: true, isInstalled: true }

      expect(restingState()).toBe('idle')
    })

    it('should rest at no-model when only a partial download is on disk', () => {
      installState.value = { hasAnyFiles: true, isInstalled: false }

      expect(restingState()).toBe('no-model')
    })

    it('should rest at no-model when nothing is on disk', () => {
      expect(restingState()).toBe('no-model')
    })
  })

  describe('fail', () => {
    it('should record the message and stop reporting progress', () => {
      downloadProgress.value = 40

      fail('out of memory')

      expect(state.value).toBe('error')
      expect(error.value).toBe('out of memory')
      expect(downloadProgress.value).toBeNull()
    })
  })
})
