// Drift detector for the `pages` content collection. `PAGE_SLUGS`
// in `src/lib/routes.ts` is the single source of truth — both
// `src/content.config.ts` (the discriminated-union variants) and
// `src/lib/i18n.ts` (the runtime `isPageSlug` guard) reach into
// it. The test below adds a third anchor: the actual `.md` files
// under `src/content/pages/{en,es}/`.
//
// All three must agree. If any drifts, this test fails BEFORE the
// build does, with a clearer message than Zod's validation
// catching a missing slug or a content file with no matching
// schema variant.

import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_SLUGS } from '../../src/lib/routes';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

async function slugsInDir(relPath: string): Promise<string[]> {
  const files = await readdir(resolve(ROOT, relPath));
  return files
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

describe('PAGE_SLUGS drift detection', () => {
  it('matches the slugs of src/content/pages/en/*.md', async () => {
    const slugs = await slugsInDir('src/content/pages/en');
    expect(slugs).toEqual([...PAGE_SLUGS].sort());
  });

  it('matches the slugs of src/content/pages/es/*.md', async () => {
    const slugs = await slugsInDir('src/content/pages/es');
    expect(slugs).toEqual([...PAGE_SLUGS].sort());
  });
});
