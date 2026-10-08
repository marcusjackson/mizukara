import { describe, expect, it } from 'vitest'

import type {
  LocalInferenceModel,
  LocalInferenceState,
  LocalInferenceUnsupportedReason
} from './local-inference-types'

/**
 * These types carry no runtime code. What is worth testing is that the state
 * union stays exhaustively switchable — a state added without a matching
 * branch is exactly the bug that strands the engine in an unrendered state.
 */
function describeState(state: LocalInferenceState): string {
  switch (state) {
    case 'unsupported':
      return 'unsupported'
    case 'no-model':
      return 'no model'
    case 'downloading':
      return 'downloading'
    case 'loading':
      return 'loading'
    case 'idle':
      return 'idle'
    case 'ready':
      return 'ready'
    case 'working':
      return 'working'
    case 'error':
      return 'error'
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

describe('local inference types', () => {
  it('should describe every engine state when switched over exhaustively', () => {
    const states: LocalInferenceState[] = [
      'unsupported',
      'no-model',
      'downloading',
      'loading',
      'idle',
      'ready',
      'working',
      'error'
    ]

    expect(states.map(describeState)).toHaveLength(states.length)
  })

  it('should accept a fully specified model when building a registry entry', () => {
    const model: LocalInferenceModel = {
      downloadBytes: 1,
      dtype: 'q8',
      name: 'Test',
      note: 'Test',
      repoId: 'org/repo',
      weightsFile: 'model_quantized.onnx'
    }

    expect(model.dtype).toBe('q8')
  })

  it('should distinguish the two unsupported reasons, which have different fixes', () => {
    const reasons: LocalInferenceUnsupportedReason[] = [
      'no-worker',
      'no-webassembly'
    ]

    expect(new Set(reasons).size).toBe(2)
  })
})
