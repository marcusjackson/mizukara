// Writes the reference vectors the app standardises tag scores against.
//
//   pnpm exec node scripts/tag-head/build-reference.mjs
//
// Needs Node 24 or newer. A tag's score is only comparable with another tag's after each is measured
// against how that scorer behaves over ordinary entries; these are those entries, embedded the way
// the app embeds one. Every STEP-th evaluation entry (never the head's training data, whose scores
// are more extreme than on unseen text), so the set is the same on every run.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { startEmbedder } from './embedder.mjs'
import { EMBEDDING_MODEL } from '../../src/modules/local-inference/utils/embedding-model.ts'

const STEP = 2

const ROOT = path.resolve(import.meta.dirname, '../..')
const entries = JSON.parse(
  readFileSync(path.join(import.meta.dirname, 'data/eval-entries.json'), 'utf8')
)
const texts = entries.filter((_, i) => i % STEP === 0).map((e) => e.text)

const embedder = await startEmbedder()
const vectors = await embedder.embed(
  EMBEDDING_MODEL.repoId,
  EMBEDDING_MODEL.dtype,
  texts.map((t) => EMBEDDING_MODEL.prefix + t)
)
await embedder.close()

const round = (x) => Number(x.toPrecision(4))
writeFileSync(
  path.join(ROOT, 'src/modules/local-inference/tag-reference.json'),
  JSON.stringify({
    model: EMBEDDING_MODEL,
    vectors: vectors.map((v) => v.map(round))
  })
)
console.log(`wrote ${vectors.length} reference vectors`)
