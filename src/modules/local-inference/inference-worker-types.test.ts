import { describe, expect, it } from 'vitest'

import type {
  InferenceWorkerRequest,
  InferenceWorkerResponse
} from './inference-worker-types'

/**
 * The protocol is types only. What is worth pinning is that both unions stay
 * exhaustively switchable: a response variant added without a branch on the
 * main thread is a request that never settles and a UI that hangs with no
 * error, which is the exact failure this protocol is shaped to avoid.
 */
function describeResponse(response: InferenceWorkerResponse): string {
  switch (response.kind) {
    case 'progress':
      return `progress ${String(response.percent)}`
    case 'loaded':
      return 'loaded'
    case 'embedded':
      return String(response.vector.length)
    case 'failed':
      return response.message
    default: {
      const exhaustive: never = response
      return exhaustive
    }
  }
}

function describeRequest(request: InferenceWorkerRequest): string {
  switch (request.kind) {
    case 'load':
      return request.repoId
    case 'embed':
      return request.text
    default: {
      const exhaustive: never = request
      return exhaustive
    }
  }
}

describe('inference worker protocol', () => {
  it('should describe every response variant when switched over exhaustively', () => {
    const responses: InferenceWorkerResponse[] = [
      { kind: 'progress', percent: 40, requestId: 'a' },
      { kind: 'loaded', requestId: 'a' },
      { kind: 'embedded', requestId: 'a', vector: [0.1, 0.2] },
      { kind: 'failed', message: 'out of memory', requestId: 'a' }
    ]

    expect(responses.map(describeResponse)).toEqual([
      'progress 40',
      'loaded',
      '2',
      'out of memory'
    ])
  })

  it('should describe every request variant when switched over exhaustively', () => {
    const requests: InferenceWorkerRequest[] = [
      {
        dtype: 'q8',
        kind: 'load',
        repoId: 'org/model',
        requestId: 'a',
        totalBytes: 100
      },
      {
        kind: 'embed',
        requestId: 'b',
        text: 'Entry'
      }
    ]

    expect(requests.map(describeRequest)).toEqual(['org/model', 'Entry'])
  })
})
