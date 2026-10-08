import type { EmbeddingModelContract } from './utils/embedding-model'

/**
 * A trained classifier head: one linear scorer per catalog tag, applied to an
 * entry's embedding after each dimension is standardised.
 */
export interface TagHead {
  /** The pipeline that produced the training vectors. Must equal the app's embedding model. */
  model: EmbeddingModelContract
  /** Catalog tag names, in the order of `weights` and `bias`. */
  tags: string[]
  /** Per-dimension mean of the training vectors. */
  mean: number[]
  /** Per-dimension spread of the training vectors. */
  scale: number[]
  /** `weights[t]` scores tag `t`; one weight per embedding dimension. */
  weights: number[][]
  bias: number[]
  training: {
    entries: number
    epochs: number
    learningRate: number
    l2: number
  }
}

export interface RankedTag {
  tag: string
  score: number
}

/**
 * Embedded ordinary entries, shipped so that scores from different scorers can
 * be put on one scale. Embedded exactly as the head's training vectors were.
 */
export interface TagReference {
  model: EmbeddingModelContract
  vectors: number[][]
}

/** The shipped head with the reference entries its scores are standardised against. */
export interface ShippedScorer {
  head: TagHead
  reference: TagReference
}
