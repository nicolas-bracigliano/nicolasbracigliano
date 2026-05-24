// Unit tests for the /now route's content schema. Validates the
// frontmatter on `src/content/pages/{en,es}/now.md` against the
// Zod schema in `src/lib/now-items.ts` BEFORE the full Astro
// build runs — catches a malformed YAML edit in ~150 ms instead
// of waiting for the e2e suite to render the page (~6 s) or
// production traffic to show empty cards.
//
// Why parse YAML directly instead of going through Astro's
// content layer: `astro:content`'s `getCollection` is a virtual
// module that needs the full Astro build graph (loaders, the
// content store, image resolution). Pulling that into vitest
// would either require a custom test environment or stubbing
// the entire content runtime — both heavier than the 150 ms
// payoff we're after.
//
// The `yaml` package is the cost of this choice: it's a
// transitive dep already (via @astrojs/check → language-server
// → yaml-language-server, pinned to ^2.8.3 by the
// security-overrides PR), so promoting it to a direct devDep is
// ~50 KB of node_modules and zero new transitives. The schema
// itself stays Astro-free in `src/lib/now-items.ts`.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import { nowItemSchema, NOW_ITEM_COUNT, nowItemKinds } from '../../src/lib/now-items';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

async function loadFrontmatter(relPath: string): Promise<Record<string, unknown>> {
  const text = await readFile(resolve(ROOT, relPath), 'utf-8');
  // YAML frontmatter sits between the first two `---` fences. We
  // split on `\n---\n` rather than `/---/` so a stray `---` inside
  // a YAML string doesn't false-positive.
  const segments = text.split(/^---$/m);
  // segments: ['', '<yaml>', '<body>']
  const yamlBlock = segments[1];
  if (!yamlBlock) {
    throw new Error(`No frontmatter in ${relPath}`);
  }
  return parseYaml(yamlBlock) as Record<string, unknown>;
}

describe.each([
  ['src/content/pages/en/now.md', 'en'],
  ['src/content/pages/es/now.md', 'es'],
] as const)('%s', (path, locale) => {
  it(`carries exactly ${NOW_ITEM_COUNT} items`, async () => {
    const fm = await loadFrontmatter(path);
    expect(Array.isArray(fm.items)).toBe(true);
    expect((fm.items as unknown[]).length).toBe(NOW_ITEM_COUNT);
  });

  it('every item passes the nowItemSchema validator', async () => {
    const fm = await loadFrontmatter(path);
    const items = fm.items as unknown[];
    // `safeParse` per item so a failure points at the offending
    // index instead of the first error short-circuiting.
    items.forEach((item, i) => {
      const result = nowItemSchema.safeParse(item);
      expect(result.success, `item[${i}] (${path}): ${JSON.stringify(result.error?.issues)}`).toBe(
        true,
      );
    });
  });

  it('uses each kind exactly once and only known kinds', async () => {
    // Prototype design ships exactly one item per kind. Future
    // content rewrites that intentionally reuse a kind (or drop
    // one) update this assertion alongside the markdown.
    const fm = await loadFrontmatter(path);
    const items = fm.items as Array<{ kind: string }>;
    const seenKinds = items.map((i) => i.kind);
    expect(new Set(seenKinds).size).toBe(NOW_ITEM_COUNT);
    seenKinds.forEach((k) => {
      expect(nowItemKinds).toContain(k);
    });
    // Locale-marker so failures across both files don't blur.
    expect(locale).toMatch(/^(en|es)$/);
  });
});
