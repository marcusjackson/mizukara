/**
 * Inference Worker Protocol
 *
 * The only vocabulary shared between the main thread and the worker.
 *
 * This file deliberately imports nothing and references no browser type. It
 * is loaded from both sides, and the two sides do not agree on what their
 * global scope is: the app is type-checked against the DOM, the worker is
 * not, and the two type libraries cannot coexist in one program.
 */

/** Work the main thread asks the worker to do. */
export type InferenceWorkerRequest =
  | {
      kind: 'load'
      requestId: string
      repoId: string
      dtype: string
      /**
       * Total bytes of the model's weights, used as the progress denominator.
       *
       * The worker cannot compute this: per-file totals only arrive as each
       * file starts downloading, so a sum over them grows as the download
       * proceeds and the reported percentage would go backwards.
       */
      totalBytes: number
    }
  | {
      kind: 'embed'
      requestId: string
      /** The text exactly as it is to be embedded, prefix included. */
      text: string
    }

/**
 * What the worker sends back.
 *
 * There is no `dispose`. Freeing the memory a loaded model holds means
 * terminating the worker, and a terminated worker cannot reply — so teardown
 * is something the main thread does to the worker, not something it asks for.
 */
export type InferenceWorkerResponse =
  | { kind: 'progress'; requestId: string; percent: number }
  | { kind: 'loaded'; requestId: string }
  | { kind: 'embedded'; requestId: string; vector: number[] }
  | { kind: 'failed'; requestId: string; message: string }

/**
 * The parts of the worker's global scope this worker actually uses.
 *
 * Declared by hand instead of adding the `WebWorker` type library, which
 * conflicts with `DOM` across the whole program, or a second `tsconfig`,
 * which costs another type-check pass in lint and build for one file.
 */
export interface InferenceWorkerScope {
  postMessage: (message: InferenceWorkerResponse) => void
  addEventListener: (
    type: 'message',
    listener: (event: { data: InferenceWorkerRequest }) => void
  ) => void
}
