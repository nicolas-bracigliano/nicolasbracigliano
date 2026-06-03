// Shared helper for unit tests that validate a content page's
// frontmatter against its Zod schema WITHOUT booting Astro's content
// layer — catches a malformed YAML edit in ~150 ms instead of at e2e
// (~6 s) or in production.
//
// Why parse YAML directly instead of going through `astro:content`:
// `getCollection` is a virtual module that needs the full Astro build
// graph (loaders, the content store, image resolution). Pulling that
// into vitest would mean a custom test environment or stubbing the whole
// content runtime — both heavier than the payoff. The schemas under test
// stay Astro-free (e.g. `src/lib/now-items.ts`) precisely so they can be
// exercised here.
//
// The `yaml` package is the cost: already a transitive dep (via
// @astrojs/check → language-server → yaml-language-server, pinned by the
// security overrides in pnpm-workspace.yaml), so the direct devDep adds
// ~50 KB and zero new transitives.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { frontmatterOf } from '../../../scripts/frontmatter.ts';

// Repo root — four levels up from tests/unit/helpers/frontmatter.ts.
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');

/** Reads `relPath` (relative to the repo root) and returns its parsed
 *  YAML frontmatter. The fence-matching + parse itself lives in the
 *  shared `scripts/frontmatter.ts` reader (one regex for the whole
 *  tooling layer); this wrapper adds the file I/O and the throw-on-missing
 *  policy the tests want. */
export async function loadFrontmatter(relPath: string): Promise<Record<string, unknown>> {
  const text = await readFile(resolve(ROOT, relPath), 'utf-8');
  const fm = frontmatterOf(text);
  if (!fm) {
    throw new Error(`No frontmatter in ${relPath}`);
  }
  return fm;
}
