// fleet:begin e2e-related-script sha=0e51f04962 | machine-written; edit the source, not this region
// e2e-related — run the e2e specs and VRT files that the changed paths can break, not the whole suite.
// Machine-written by fleet-sync (block e2e-related-script); edit the source in the tooling repo.
//
//   node scripts/e2e-related.mjs run   [--base REF] [--update] [--dry]
//   node scripts/e2e-related.mjs check
//
// The map is e2e/targets.map, one rule per line:   <path prefix> -> <target>, <target>, ...
// A target is a path under e2e/ (a `*` glob is allowed), optionally `file#grep` to run only the VRT
// groups whose title matches. `*` alone means the whole suite; `-` means no e2e test is affected.
// The longest matching prefix wins per changed path. A changed src/ path no rule claims runs the whole
// suite, and says so: a missing rule costs time, never coverage.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const MAP = 'e2e/targets.map';
const VRT = /(\.vrt\.ts|(^|\/)visual-regression[^/]*\.test\.ts)$/;
const SPEC = /(\.test\.ts|\.vrt\.ts)$/;

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((n) => {
        const p = posix.join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : [p];
      })
    : [];
const specs = () => walk('e2e').filter((p) => SPEC.test(p)).map((p) => p.slice('e2e/'.length));

function loadMap() {
  if (!existsSync(MAP)) throw new Error(`${MAP} is missing`);
  return readFileSync(MAP, 'utf8')
    .split('\n')
    .map((l, i) => ({ line: i + 1, text: l.replace(/#\s.*$/, '').trim() }))
    .filter((l) => l.text)
    .map(({ line, text }) => {
      const m = /^(\S+)\s*->\s*(.+)$/.exec(text);
      if (!m) throw new Error(`${MAP}:${line}: expected "<prefix> -> <targets>"`);
      const targets = m[2].split(',').map((t) => t.trim()).filter(Boolean).map((t) => {
        const [file, ...g] = t.split('#');
        return { file, grep: g.length ? g.join('#') : null };
      });
      return { line, prefix: m[1], targets };
    });
}

const globRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
const expand = (file, all) => (file === '*' || file === '-' ? [] : all.filter((s) => globRe(file).test(s)));

function check() {
  const rules = loadMap();
  const all = specs();
  const covered = new Set();
  const problems = [];
  const srcFiles = walk('src');
  for (const r of rules) {
    if (!srcFiles.some((f) => f.startsWith(r.prefix))) problems.push(`${MAP}:${r.line}: prefix ${r.prefix} matches no file under src/`);
    for (const t of r.targets) {
      if (t.file === '*' || t.file === '-') continue;
      const hit = expand(t.file, all);
      if (!hit.length) problems.push(`${MAP}:${r.line}: target ${t.file} matches no e2e file`);
      hit.forEach((h) => covered.add(h));
    }
  }
  for (const s of all) if (!covered.has(s)) problems.push(`e2e/${s} is not named by any rule in ${MAP}`);
  if (problems.length) {
    console.error(problems.join('\n'));
    return 1;
  }
  console.log(`e2e-map ok: ${all.length} e2e files, ${rules.length} rules`);
  return 0;
}

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
}

function changedPaths(base) {
  const ref = base && spawnSync('git', ['rev-parse', '-q', '--verify', base]).status === 0 ? base : null;
  const all = [
    ...(ref ? git(['diff', '--no-renames', '--name-only', `${ref}...HEAD`]) : []),
    ...git(['diff', '--no-renames', '--name-only', 'HEAD']),
    ...git(['ls-files', '--others', '--exclude-standard']),
  ];
  return [...new Set(all)];
}

// Decide what to run: { full: reason | null, files: Map(file -> Set(grep | null)) }.
function plan(paths, rules, all) {
  const files = new Map();
  const add = (f, g = null) => {
    if (!files.has(f)) files.set(f, new Set());
    files.get(f).add(g);
  };
  let full = null;
  for (const p of paths) {
    if (p === MAP) continue;
    if (/^playwright.*\.config\.ts$|^tsconfig\.e2e\.json$/.test(p)) {
      full ??= `${p} changed`;
    } else if (p.startsWith('e2e/')) {
      const rel = p.slice('e2e/'.length);
      const own = rel.replace(/-snapshots\/.*$/, '');
      if (all.includes(own)) add(own);
      else if (SPEC.test(rel) && !existsSync(p)) continue; // a deleted spec runs nothing
      else full ??= `${p} is shared e2e support`;
    } else if (p.startsWith('src/') && !/\.(test|spec)\.ts$/.test(p)) {
      const rule = rules.filter((r) => p.startsWith(r.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0];
      if (!rule) full ??= `${p} is not in ${MAP}`;
      else
        for (const t of rule.targets) {
          if (t.file === '*') full ??= `${rule.prefix} maps to the whole suite`;
          else for (const f of expand(t.file, all)) add(f, t.grep);
        }
    }
  }
  return { full, files };
}

function exec(args, dry) {
  console.log(`$ pnpm exec playwright test ${args.join(' ')}`);
  if (dry) return 0;
  return spawnSync('pnpm', ['exec', 'playwright', 'test', ...args], { stdio: 'inherit' }).status ?? 1;
}

function run(argv) {
  const opt = (n) => argv.includes(n);
  const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : null;
  const dry = opt('--dry');
  // One retry for the functional specs: a single spec fails now and then under
  // load and passes alone. Playwright reports a retried pass as "flaky", so it
  // stays visible. Screenshot specs never retry, since a diff is a real result.
  const RETRY = ['--retries=1'];
  const update = opt('--update') ? ['--update-snapshots'] : [];
  const rules = loadMap();
  const all = specs();
  const { full, files } = plan(changedPaths(base), rules, all);
  let status = 0;
  const note = (s) => (status = status || s);
  if (full) {
    console.log(`e2e-related: running the whole suite (${full}).`);
    note(exec(['--project=chromium', '--workers=2', ...RETRY], dry));
    note(exec(['--project=visual', ...update], dry));
    console.log(`E2E-SUMMARY mode=full reason="${full}"`);
    return status;
  }
  const plain = [...files.keys()].filter((f) => !VRT.test(f)).sort();
  const vrt = [...files.keys()].filter((f) => VRT.test(f)).sort();
  if (plain.length) note(exec(['--project=chromium', '--workers=2', ...RETRY, ...plain.map((f) => `e2e/${f}`)], dry));
  for (const f of vrt) {
    const greps = files.get(f);
    const g = greps.has(null) ? [] : ['-g', [...greps].map((x) => `(${x})`).join('|')];
    note(exec(['--project=visual', `e2e/${f}`, ...g, ...update], dry));
  }
  console.log(
    plain.length + vrt.length
      ? `E2E-SUMMARY mode=targeted chromium=${plain.length} vrt=${vrt.length}`
      : 'E2E-SUMMARY mode=none (no changed path maps to an e2e test)'
  );
  return status;
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  process.exit(cmd === 'check' ? check() : cmd === 'run' ? run(rest) : (console.error('usage: e2e-related.mjs run|check'), 2));
} catch (err) {
  console.error(`e2e-related: ${err.message}`);
  process.exit(2);
}
// fleet:end e2e-related-script
