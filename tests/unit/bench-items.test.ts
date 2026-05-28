// Unit tests for the home page's "currently on the bench" schema.
// Validates the `bench:` frontmatter on
// `src/content/pages/{en,es}/home.md` against the Zod schema in
// `src/lib/bench-items.ts` before the full Astro build runs — catches a
// malformed YAML edit (or a missing kind-conditional caption) in ~150 ms
// instead of at e2e or in production. Frontmatter loading lives in
// ./helpers/frontmatter (shared with now-items.test.ts).

import { describe, expect, it } from 'vitest';
import { benchItemSchema, BENCH_MIN, BENCH_MAX } from '../../src/lib/bench-items';
import { BENCH_KINDS } from '../../src/lib/content-kinds';
import { loadFrontmatter } from './helpers/frontmatter';

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
      expect(BENCH_KINDS).toContain(i.kind);
    });
    // Locale-marker so failures across both files don't blur.
    expect(locale).toMatch(/^(en|es)$/);
  });
});
