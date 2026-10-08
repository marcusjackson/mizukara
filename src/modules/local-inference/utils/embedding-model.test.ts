import { describe, expect, it } from 'vitest'

import { EMBEDDING_MODEL } from './embedding-model'

describe('EMBEDDING_MODEL', () => {
  it('should name the weights file the dtype selects, so detection and download agree', () => {
    expect(EMBEDDING_MODEL.dtype).toBe('q8')
    expect(EMBEDDING_MODEL.file).toBe('model_quantized.onnx')
  })

  it('should use no query prefix, which the head was not trained with', () => {
    expect(EMBEDDING_MODEL.prefix).toBe('')
  })

  it('should produce unit-length mean-pooled vectors of the head width', () => {
    expect(EMBEDDING_MODEL.pooling).toBe('mean')
    expect(EMBEDDING_MODEL.normalize).toBe(true)
    expect(EMBEDDING_MODEL.dimensions).toBe(384)
  })
})
