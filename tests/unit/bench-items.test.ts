// Unit tests for the home page's "currently on the bench" schema.
// Validates the `bench:` frontmatter on
// `src/content/pages/{en,es}/home.md` against the Zod schema in
// `src/lib/bench-items.ts` BEFORE the full Astro build runs — catches a
// malformed YAML edit in ~150 ms instead of waiting for the e2e suite or
// production traffic to surface an empty/wrong-locale card.
//
// Same approach + `yaml` devDependency rationale as `now-items.test.ts`:
// parsing the frontmatter directly avoids pulling Astro's content-layer
// virtual modules into vitest, and the schema itself stays Astro-free.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import { benchItemSchema, benchItemKinds, BENCH_MIN, BENCH_MAX } from '../../src/lib/bench-items';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

async function loadFrontmatter(relPath: string): Promise<Record<string, unknown>> {
  const text = await readFile(resolve(ROOT, relPath), 'utf-8');
  // YAML frontmatter sits between the first two `---` fences.
  const segments = text.split(/^---$/m);
  const yamlBlock = segments[1];
  if (!yamlBlock) {
    throw new Error(`No frontmatter in ${relPath}`);
  }
  return parseYaml(yamlBlock) as Record<string, unknown>;
}

describe.each([
  ['src/content/pages/en/home.md', 'en'],
  ['src/content/pages/es/home.md', 'es'],
] as const)('%s', (path, locale) => {
  it(`carries between ${BENCH_MIN} and ${BENCH_MAX} bench items`, async () => {
    const fm = await loadFrontmatter(path);
    expect(Array.isArray(fm.bench)).toBe(true);
    const len = (fm.bench as unknown[]).length;
    expect(len).toBeGreaterThanOrEqual(BENCH_MIN);
    expect(len).toBeLessThanOrEqual(BENCH_MAX);
  });

  it('every item passes the benchItemSchema validator', async () => {
    const fm = await loadFrontmatter(path);
    const items = fm.bench as unknown[];
    // `safeParse` per item so a failure points at the offending index
    // (and surfaces the kind-conditional caption refines) instead of the
    // first error short-circuiting.
    items.forEach((item, i) => {
      const result = benchItemSchema.safeParse(item);
      expect(result.success, `bench[${i}] (${path}): ${JSON.stringify(result.error?.issues)}`).toBe(
        true,
      );
    });
  });

  it('uses only known kinds', async () => {
    const fm = await loadFrontmatter(path);
    const items = fm.bench as Array<{ kind: string }>;
    items.forEach((i) => {
      expect(benchItemKinds).toContain(i.kind);
    });
    // Locale-marker so failures across both files don't blur.
    expect(locale).toMatch(/^(en|es)$/);
  });
});
