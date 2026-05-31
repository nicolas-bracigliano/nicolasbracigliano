// Unit tests for the /now route's content schema. Validates the
// frontmatter on `src/content/pages/{en,es}/now.md` against the Zod
// schema in `src/lib/now-items.ts` before the full Astro build runs, and
// exercises `benchItemsFrom` (the home-bench derivation) directly.
// Frontmatter loading lives in ./helpers/frontmatter, where the
// direct-YAML-parse rationale is documented.
//
// Since the bench/now unification (ADR 0014), now.md is the single source
// for both the full /now tour and the home page's "currently on the
// bench" grid (the teaser'd items). The bench-shape checks that used to
// live in bench-items.test.ts are folded in here.

import { describe, expect, it } from 'vitest';
import {
  nowItemSchema,
  benchItemsFrom,
  NOW_ITEM_MIN,
  NOW_ITEM_MAX,
  type NowPageItem,
} from '../../src/lib/now-items';
import { NOW_KINDS, BENCH_KINDS } from '../../src/lib/content-kinds';
import { loadFrontmatter } from './helpers/frontmatter';

describe.each([
  ['src/content/pages/en/now.md', 'en'],
  ['src/content/pages/es/now.md', 'es'],
] as const)('%s', (path, locale) => {
  it(`carries between ${NOW_ITEM_MIN} and ${NOW_ITEM_MAX} items`, async () => {
    const fm = await loadFrontmatter(path);
    expect(Array.isArray(fm.items)).toBe(true);
    const len = (fm.items as unknown[]).length;
    expect(len).toBeGreaterThanOrEqual(NOW_ITEM_MIN);
    expect(len).toBeLessThanOrEqual(NOW_ITEM_MAX);
  });

  it('every item passes the nowItemSchema validator', async () => {
    const fm = await loadFrontmatter(path);
    const items = fm.items as unknown[];
    // `safeParse` per item so a failure points at the offending index
    // (and surfaces the teaser's kind-conditional caption refines)
    // instead of the first error short-circuiting.
    items.forEach((item, i) => {
      const result = nowItemSchema.safeParse(item);
      expect(result.success, `item[${i}] (${path}): ${JSON.stringify(result.error?.issues)}`).toBe(
        true,
      );
    });
  });

  it('uses each kind at most once, and only known kinds', async () => {
    // The /now design is "one detailed update per craft" — distinct kinds.
    // Unification relaxed the *count* (fixed-6 → a range) but not this:
    // a duplicate kind would mean two bench tour entries for the same
    // craft. Asserted here so a content edit that reuses a kind is caught.
    const fm = await loadFrontmatter(path);
    const kinds = (fm.items as Array<{ kind: string }>).map((i) => i.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    kinds.forEach((k) => expect(NOW_KINDS).toContain(k));
    // Locale-marker so failures across both files don't blur.
    expect(locale).toMatch(/^(en|es)$/);
  });

  it('has at least one teaser, and every teaser sits on a bench kind', async () => {
    // The home bench is the teaser'd items, so an empty teaser set would
    // render no bench (the home page guards on `bench.length > 0`).
    // Teasers are valid only on a BENCH_KINDS kind (no coffee/read
    // vignette) — the schema enforces this; assert it here too so a
    // content edit can't quietly empty or break the home bench.
    const fm = await loadFrontmatter(path);
    const items = fm.items as Array<{ kind: string; teaser?: unknown }>;
    const teasered = items.filter((i) => i.teaser !== undefined);
    expect(teasered.length).toBeGreaterThan(0);
    teasered.forEach((i) => expect(BENCH_KINDS).toContain(i.kind));
  });
});

describe('benchItemsFrom', () => {
  // Minimal item factory — `detail` length isn't load-bearing for the
  // derivation, so keep fixtures terse.
  const item = (over: Partial<NowPageItem> & Pick<NowPageItem, 'kind'>): NowPageItem => ({
    where: 'on the bench · x',
    title: 'Title',
    prose: 'Prose.',
    detail: [
      { dt: 'a', dd: '1' },
      { dt: 'b', dd: '2' },
      { dt: 'c', dd: '3' },
    ],
    ...over,
  });

  it('selects only teaser-bearing items, in document order', () => {
    const out = benchItemsFrom([
      item({ kind: 'code', title: 'Site', teaser: { label: 'code', line: 'L1' } }),
      item({ kind: 'coffee' }), // no teaser — excluded
      item({ kind: 'print', title: 'Tray', teaser: { label: '3d', line: 'L2' } }),
    ]);
    expect(out.map((b) => b.title)).toEqual(['Site', 'Tray']);
    expect(out.map((b) => b.label)).toEqual(['code', '3d']);
  });

  it('maps title from the item and label/line/captions from the teaser', () => {
    const [b] = benchItemsFrom([
      item({
        kind: 'guitar',
        title: 'Bars 9–16',
        teaser: { label: 'guitar', line: 'Looping.', guitarLabel: 'A m' },
      }),
    ]);
    expect(b).toEqual({
      kind: 'guitar',
      label: 'guitar',
      title: 'Bars 9–16',
      line: 'Looping.',
      guitarLabel: 'A m',
      seedlingTag: undefined,
    });
  });

  it('defensively skips a teaser on a non-bench kind (guard, not just schema)', () => {
    // The schema refine forbids this, but benchItemsFrom is the last line
    // of defense: a coffee/read item should never reach BenchCard (which
    // has no vignette for it), even if a teaser slips through.
    const out = benchItemsFrom([item({ kind: 'read', teaser: { label: 'read', line: 'x' } })]);
    expect(out).toEqual([]);
  });
});
