#!/usr/bin/env node
// Generates the trimmed PR Lighthouse config FROM the canonical
// lighthouserc.json, so the budget has a single source of truth.
//
// PR runs audit one URL per layout instead of the full set, so feedback
// stays fast (~2 min vs ~5). Everything else is inherited from canonical
// verbatim: the `assert` block (score thresholds, Core Web Vitals,
// resource budgets), the collect `settings`, `numberOfRuns` (2, for
// median-of-2 stability), and `upload`. Because the budget is never
// hand-copied, a PR run can't pass a looser budget than main enforces.
//
// Run:    pnpm lhci:pr-config   (or: node scripts/lighthouse-pr-config.mjs)
// Output: lighthouserc.pr.generated.json — gitignored, regenerated in CI.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CANONICAL = 'lighthouserc.json';
const OUTPUT = 'lighthouserc.pr.generated.json';

// One representative URL per layout. A regression on any URL NOT in this
// set (the other pieces, the ES siblings, the works slug) still surfaces
// on the full post-merge run against canonical. Keep every entry a member
// of canonical's url[] — the test enforces the subset.
export const PR_LAYOUT_URLS = [
  'http://localhost/en/', // home
  'http://localhost/en/notes/', // notes index
  'http://localhost/en/notes/hello/', // note slug
  'http://localhost/en/about/', // about page
  'http://localhost/en/pieces/', // pieces index
  'http://localhost/en/pieces/rings-i-keep-redrawing/', // piece slug
];

export function buildPrConfig(canonical) {
  return {
    ...canonical,
    '//':
      'GENERATED from lighthouserc.json by scripts/lighthouse-pr-config.mjs — do not edit. ' +
      'Trims to one URL per layout for fast PR feedback; budget, settings, runs and upload are inherited from canonical.',
    ci: {
      ...canonical.ci,
      collect: {
        ...canonical.ci.collect,
        url: [...PR_LAYOUT_URLS],
      },
    },
  };
}

export function loadCanonical(root = ROOT) {
  return JSON.parse(readFileSync(resolve(root, CANONICAL), 'utf-8'));
}

function main() {
  const canonical = loadCanonical();
  const pr = buildPrConfig(canonical);
  writeFileSync(resolve(ROOT, OUTPUT), JSON.stringify(pr, null, 2) + '\n');
  console.log(
    `Wrote ${OUTPUT}: ${pr.ci.collect.url.length} URL(s) x ${pr.ci.collect.numberOfRuns} run(s) ` +
      `(trimmed from ${canonical.ci.collect.url.length} URL(s) in ${CANONICAL}).`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
