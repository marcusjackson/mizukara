import { describe, expect, it } from 'vitest'

import { describeFailure, readVector } from './inference-reply'

describe('readVector', () => {
  it('should read the data of a tensor as a plain array', () => {
    expect(readVector({ data: new Float32Array([0.5, -0.25]) })).toEqual([
      0.5, -0.25
    ])
  })

  it('should accept a plain array of numbers', () => {
    expect(readVector({ data: [1, 2] })).toEqual([1, 2])
  })

  it('should return nothing when there is no data', () => {
    expect(readVector(null)).toEqual([])
    expect(readVector(undefined)).toEqual([])
    expect(readVector({})).toEqual([])
  })

  it('should return nothing when the data is not numbers', () => {
    expect(readVector({ data: ['a'] })).toEqual([])
    expect(readVector({ data: 'nope' })).toEqual([])
  })
})

describe('describeFailure', () => {
  it('should explain a full storage area in terms someone can act on', () => {
    const error = new Error('quota')
    error.name = 'QuotaExceededError'

    expect(describeFailure(error)).toContain('not enough free storage')
  })

  it('should pass through an ordinary error message', () => {
    expect(describeFailure(new Error('worker lost'))).toBe('worker lost')
  })

  it('should say something when a non-error is thrown', () => {
    expect(describeFailure('boom')).toContain('unknown reason')
  })
})
