import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  describeUnsupportedReason,
  probeInferenceSupport
} from './inference-support'

describe('probeInferenceSupport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should report support when a worker and WebAssembly exist', () => {
    vi.stubGlobal('Worker', vi.fn())
    vi.stubGlobal('WebAssembly', {})

    expect(probeInferenceSupport()).toBeNull()
  })

  it('should report no worker when the constructor is missing', () => {
    vi.stubGlobal('Worker', undefined)

    expect(probeInferenceSupport()).toBe('no-worker')
  })

  it('should report no WebAssembly when it is missing', () => {
    vi.stubGlobal('Worker', vi.fn())
    vi.stubGlobal('WebAssembly', undefined)

    expect(probeInferenceSupport()).toBe('no-webassembly')
  })
})

describe('describeUnsupportedReason', () => {
  it('should give each reason its own sentence', () => {
    expect(describeUnsupportedReason('no-worker')).not.toBe(
      describeUnsupportedReason('no-webassembly')
    )
  })
})
