/**
 * The embedding pipeline the shipped tag head is trained against.
 *
 * Every field is part of the contract: the head's weights only mean something
 * for vectors produced exactly this way. Change any of them and the head must
 * be retrained, which is why `tag-head.test.ts` compares this against what the
 * head records. The training script in `scripts/tag-head/` reads this file too,
 * so it embeds the corpus the way the app will embed an entry.
 */

export interface EmbeddingModelContract {
  readonly repoId: string
  /** The weights file the download must contain; the quantised build. */
  readonly file: string
  /** Transformers.js dtype name that selects `file`. */
  readonly dtype: string
  readonly pooling: string
  readonly normalize: boolean
  /** Text prepended to every input. Empty: the model's retrieval prefix is not used. */
  readonly prefix: string
  readonly dimensions: number
}

export const EMBEDDING_MODEL: EmbeddingModelContract = {
  dimensions: 384,
  dtype: 'q8',
  file: 'model_quantized.onnx',
  normalize: true,
  pooling: 'mean',
  prefix: '',
  repoId: 'Xenova/bge-small-en-v1.5'
}
