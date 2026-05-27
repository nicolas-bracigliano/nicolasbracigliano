// Single source of truth for the home page's "currently on the bench"
// items. `src/content.config.ts` uses the Zod schema below to validate
// the `bench: …` frontmatter on `src/content/pages/{en,es}/home.md`;
// `src/components/BenchCard.astro` uses the inferred kind union for its
// prop type. Either file is free to evolve — the other follows, because
// both reach into this module (same drift-removal rationale as
// `src/lib/now-items.ts`).
//
// Pure types + Zod — no Astro framework imports — so this file is
// unit-testable in plain vitest without spinning up the content layer.

import { z } from 'astro/zod';

/** The bench kinds. Each value selects a BenchCard vignette
 *  (`.bench-card--<kind>`) and the inline SVG it renders. Exported as a
 *  const tuple (not just a type) so runtime consumers — the schema, the
 *  unit test — can iterate the kinds. `BenchItemKind` is
 *  `(typeof benchItemKinds)[number]`, so type and value never drift. */
export const benchItemKinds = ['code', 'guitar', 'garden', 'print'] as const;
export type BenchItemKind = (typeof benchItemKinds)[number];

/** One bench item.
 *
 *  `label` is the localized eyebrow word (EN "code" / ES "código";
 *  "3d" for the print kind), NOT the kind — the display number
 *  ("01 · ") is derived from array position at render, so adding,
 *  removing or reordering items renumbers automatically instead of
 *  going stale.
 *
 *  `guitarLabel` / `seedlingTag` are captions baked into the guitar and
 *  seedling vignettes. They're optional on the object but made
 *  kind-conditionally required by the refines below: a guitar card with
 *  no label (or a garden card with no tag) fails Zod at build time
 *  rather than rendering an empty caption. This also lets BenchCard drop
 *  its old hardcoded defaults, which were Spanish strings that would
 *  silently appear on an English card if a caption were omitted. */
export const benchItemSchema = z
  .object({
    kind: z.enum(benchItemKinds),
    label: z.string().min(1),
    title: z.string().min(1),
    line: z.string().min(1),
    seedlingTag: z.string().min(1).optional(),
    guitarLabel: z.string().min(1).optional(),
  })
  .refine((i) => i.kind !== 'guitar' || i.guitarLabel !== undefined, {
    message: 'guitar bench items require `guitarLabel`',
    path: ['guitarLabel'],
  })
  .refine((i) => i.kind !== 'garden' || i.seedlingTag !== undefined, {
    message: 'garden bench items require `seedlingTag`',
    path: ['seedlingTag'],
  });
export type BenchItem = z.infer<typeof benchItemSchema>;

/** Bench size bounds. The home grid is two columns; 1–6 keeps the
 *  layout sane (an odd last card spans the full row — see
 *  `src/styles/routes/home.css`). Enforced on the `bench` array in
 *  `src/content.config.ts` via `.min(BENCH_MIN).max(BENCH_MAX)`, so a
 *  content edit outside the range fails the build, not the reader. */
export const BENCH_MIN = 1;
export const BENCH_MAX = 6;

/** Narrows a `pages` collection entry to the `home` discriminated-union
 *  variant, exposing `data.bench`. The Zod schema in
 *  `src/content.config.ts` already enforces `slug === 'home'` for
 *  `pages/{en,es}/home.md`, so this throw can never fire at runtime —
 *  it's the TypeScript hook that turns `data.bench` from absent-on-the-
 *  union into present, and a clear error if a future contributor renames
 *  the markdown slug. Generic over `{ data: { slug } }` rather than
 *  `CollectionEntry<'pages'>` so the module stays Astro-import-free and
 *  vitest-able (mirrors `assertNowEntry`). */
export function assertHomeEntry<E extends { data: { slug: string } }>(
  entry: E,
): asserts entry is E & { data: { slug: 'home'; bench: BenchItem[] } } {
  if (entry.data.slug !== 'home') {
    throw new Error(`Expected pages entry with slug="home", got slug="${entry.data.slug}"`);
  }
}
