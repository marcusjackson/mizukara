// Trains the shipped tag head and writes it, plus the held-out evaluation fixture the tests use.
//
//   pnpm exec node scripts/tag-head/train-head.mjs
//
// Needs Node 24 or newer: it imports the app's .ts modules directly (type stripping).
//
// Inputs:  src/modules/local-inference/tag-catalog.json   the tags the head scores
//          scripts/tag-head/data/train.json               labelled example entries
//          scripts/tag-head/data/eval-entries.json        evaluation entries
//          scripts/tag-head/data/eval-labels.json         what a person would choose for each
// Outputs: src/modules/local-inference/tag-head.json
//          src/modules/local-inference/tag-head-eval-fixture.json
//
// One linear scorer per tag on the standardised embedding, trained by full-batch gradient descent.
// EPOCHS, LEARNING_RATE and L2 are the spike's setting and are deliberately small: much longer or
// faster training made every entry rank identically, for a reason never found. Treat them as
// load-bearing until that is understood.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { startEmbedder } from './embedder.mjs'
import { EMBEDDING_MODEL } from '../../src/modules/local-inference/utils/embedding-model.ts'
import { rankTags } from '../../src/modules/local-inference/utils/tag-head-scoring.ts'
import {
  entryMetrics,
  averageMetrics
} from '../../src/modules/local-inference/utils/tag-head-evaluation.ts'

const EPOCHS = 20
const LEARNING_RATE = 0.1
const L2 = 0.01

const ROOT = path.resolve(import.meta.dirname, '../..')
const MODULE = path.join(ROOT, 'src/modules/local-inference')
const DATA = path.join(import.meta.dirname, 'data')
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

const catalog = readJson(path.join(MODULE, 'tag-catalog.json'))
const tags = Object.values(catalog).flat()
const train = readJson(path.join(DATA, 'train.json'))
const evalEntries = readJson(path.join(DATA, 'eval-entries.json'))
const evalLabels = readJson(path.join(DATA, 'eval-labels.json'))

for (const entry of train) {
  for (const tag of entry.tags) {
    if (!tags.includes(tag))
      throw new Error(`Unknown tag "${tag}" in training data`)
  }
}

const round = (x, digits) => Number(x.toPrecision(digits))
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length

function fit(X, Y) {
  const d = X[0].length
  const T = tags.length
  const W = Array.from({ length: T }, () => new Float64Array(d))
  const bias = new Float64Array(T)
  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    const gW = Array.from({ length: T }, () => new Float64Array(d))
    const gb = new Float64Array(T)
    for (let i = 0; i < X.length; i++) {
      for (let t = 0; t < T; t++) {
        let z = bias[t]
        for (let j = 0; j < d; j++) z += W[t][j] * X[i][j]
        const err = 1 / (1 + Math.exp(-z)) - Y[i][t]
        gb[t] += err
        for (let j = 0; j < d; j++) gW[t][j] += err * X[i][j]
      }
    }
    for (let t = 0; t < T; t++) {
      bias[t] -= (LEARNING_RATE * gb[t]) / X.length
      for (let j = 0; j < d; j++) {
        W[t][j] -= LEARNING_RATE * (gW[t][j] / X.length + L2 * W[t][j])
      }
    }
  }
  return { W, bias }
}

const embedder = await startEmbedder()
const embedAll = (texts) =>
  embedder.embed(
    EMBEDDING_MODEL.repoId,
    EMBEDDING_MODEL.dtype,
    texts.map((t) => EMBEDDING_MODEL.prefix + t)
  )
const trainVectors = await embedAll(train.map((e) => e.text))
const evalVectors = await embedAll(evalEntries.map((e) => e.text))
await embedder.close()

const d = EMBEDDING_MODEL.dimensions
if (trainVectors[0].length !== d) {
  throw new Error(
    `Model returned ${trainVectors[0].length} dimensions, expected ${d}`
  )
}
const mu = Array.from({ length: d }, (_, j) =>
  mean(trainVectors.map((x) => x[j]))
)
const sd = Array.from(
  { length: d },
  (_, j) => Math.sqrt(mean(trainVectors.map((x) => (x[j] - mu[j]) ** 2))) || 1
)
const standardise = (x) => x.map((v, j) => (v - mu[j]) / sd[j])
const Y = train.map((e) => tags.map((t) => (e.tags.includes(t) ? 1 : 0)))
const { W, bias } = fit(trainVectors.map(standardise), Y)

const head = {
  model: EMBEDDING_MODEL,
  tags,
  mean: mu.map((x) => round(x, 6)),
  scale: sd.map((x) => round(x, 6)),
  weights: W.map((row) => Array.from(row, (x) => round(x, 5))),
  bias: Array.from(bias, (x) => round(x, 5)),
  training: {
    entries: train.length,
    epochs: EPOCHS,
    learningRate: LEARNING_RATE,
    l2: L2
  }
}

// Even-numbered entries are held out; odd-numbered are the dev half.
const isTest = (id) => parseInt(id.slice(1), 10) % 2 === 0
const fixture = evalEntries
  .map((e, i) => ({
    id: e.id,
    gold: evalLabels[e.id],
    vector: evalVectors[i].map((x) => round(x, 4))
  }))
  .filter((e) => e.gold)

const report = (name, rows) => {
  const m = averageMetrics(
    rows.map((r) => entryMetrics(rankTags(head, r.vector), r.gold))
  )
  const f = (x) => x.toFixed(3)
  console.log(
    `${name.padEnd(10)} n=${String(rows.length).padEnd(3)} composite ${f(m.composite)}  hit@1 ${f(m.hitAt1)}  hit@3 ${f(m.hitAt3)}  prec@3 ${f(m.precisionAt3)}  primRecall@5 ${f(m.primaryRecallAt5)}`
  )
}
report(
  'dev',
  fixture.filter((e) => !isTest(e.id))
)
report(
  'held-out',
  fixture.filter((e) => isTest(e.id))
)

writeFileSync(path.join(MODULE, 'tag-head.json'), JSON.stringify(head))
writeFileSync(
  path.join(MODULE, 'tag-head-eval-fixture.json'),
  JSON.stringify(fixture.filter((e) => isTest(e.id)))
)
console.log(`wrote head for ${tags.length} tags from ${train.length} entries`)
