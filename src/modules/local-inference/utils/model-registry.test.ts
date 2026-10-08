import { describe, expect, it } from 'vitest'

import { EMBEDDING_MODEL } from './embedding-model'
import { LOCAL_INFERENCE_MODEL } from './model-registry'

describe('LOCAL_INFERENCE_MODEL', () => {
  it('should take the repository, dtype and weights file from the embedding contract the head is trained against', () => {
    expect(LOCAL_INFERENCE_MODEL.repoId).toBe(EMBEDDING_MODEL.repoId)
    expect(LOCAL_INFERENCE_MODEL.dtype).toBe(EMBEDDING_MODEL.dtype)
    expect(LOCAL_INFERENCE_MODEL.weightsFile).toBe(EMBEDDING_MODEL.file)
  })

  it('should have a positive download size for the progress denominator', () => {
    expect(LOCAL_INFERENCE_MODEL.downloadBytes).toBeGreaterThan(0)
  })

  it('should have a name and a note', () => {
    expect(LOCAL_INFERENCE_MODEL.name.length).toBeGreaterThan(0)
    expect(LOCAL_INFERENCE_MODEL.note.length).toBeGreaterThan(0)
  })
})
