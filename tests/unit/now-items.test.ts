// Unit tests for the /now route's content schema. Validates the
// frontmatter on `src/content/pages/{en,es}/now.md` against the Zod
// schema in `src/lib/now-items.ts` before the full Astro build runs.
// Frontmatter loading lives in ./helpers/frontmatter (shared with
// bench-items.test.ts), where the direct-YAML-parse rationale is
// documented.

import { describe, expect, it } from 'vitest';
import { nowItemSchema, NOW_ITEM_COUNT } from '../../src/lib/now-items';
import { NOW_KINDS } from '../../src/lib/content-kinds';
import { loadFrontmatter } from './helpers/frontmatter';

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
      expect(NOW_KINDS).toContain(k);
    });
    // Locale-marker so failures across both files don't blur.
    expect(locale).toMatch(/^(en|es)$/);
  });
});
