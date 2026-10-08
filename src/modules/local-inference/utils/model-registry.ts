/**
 * Local Inference Model Registry
 *
 * The one model the app offers to download. How it must be run — pooling,
 * normalisation, prefix — is the shipped head's contract and lives in
 * `embedding-model.ts`; this entry only adds what Settings and the download
 * need, and takes everything it shares from that contract so the two cannot
 * drift apart.
 *
 * The size is the weights file only, re-derive with:
 *   curl -sL https://huggingface.co/api/models/<repoId>/tree/main/onnx
 * It changes whenever a model is requantised.
 */

import { EMBEDDING_MODEL } from './embedding-model'

import type { LocalInferenceModel } from '../local-inference-types'

export const LOCAL_INFERENCE_MODEL: LocalInferenceModel = {
  // 34,014,426 bytes of `model_quantized.onnx`, read from the model host.
  downloadBytes: 34014426,
  dtype: EMBEDDING_MODEL.dtype,
  name: 'Tag suggestion model',
  note: 'Reads your entry on this device and ranks your tags by meaning. Nothing leaves your device except this one download.',
  repoId: EMBEDDING_MODEL.repoId,
  weightsFile: EMBEDDING_MODEL.file
}
