// Single source of truth for the /now route's bench-tour items.
// `src/content.config.ts` uses the Zod schema below to validate
// the `items: …` frontmatter on `src/content/pages/{en,es}/now.md`;
// `src/components/NowItem.astro` uses the inferred TypeScript
// types for its prop interface. Either file is free to evolve —
// the other follows automatically because both reach into this
// module.
//
// Before this extraction, the schema lived in `content.config.ts`
// and parallel hand-written types lived in `NowItem.astro`; they
// could drift silently because each carried its own copy of the
// shape. Centralising here removes that drift surface.
//
// Pure types + Zod — no Astro framework imports — so this file is
// unit-testable in plain vitest without spinning up the content
// layer.

import { z } from 'astro/zod';

/** The six bench kinds. Each value drives both the route's CSS
 *  modifier (`.now-{kind}` for the per-kind colour tint) and the
 *  Spanish/English copy that surrounds the item. Order is the
 *  display order on the /now page.
 *
 *  Exported as a const tuple (not just a type) so runtime
 *  consumers can iterate the kinds — the test suite uses it to
 *  assert that each kind appears exactly once per locale, and a
 *  future kind-picker UI could reuse it without redeclaring the
 *  list. The `NowItemKind` union below is `(typeof
 *  nowItemKinds)[number]`, so type and value always agree. */
export const nowItemKinds = ['code', 'guitar', 'garden', 'print', 'coffee', 'read'] as const;
export type NowItemKind = (typeof nowItemKinds)[number];

/** One row of an item's detail `<dl>`. `dt` is the term label,
 *  `dd` the description. Names mirror the rendered HTML so the
 *  page's `<dl><dt><dd>` is structurally obvious. */
export const nowItemDetailSchema = z.object({
  dt: z.string().min(1),
  dd: z.string().min(1),
});
export type NowItemDetailRow = z.infer<typeof nowItemDetailSchema>;

/** Full item shape. Each item carries exactly three detail rows
 *  (locked via `.length(3)`); the prototype design has shipped
 *  with three since day one, and locking the count catches an
 *  accidental row deletion at Zod-validation time rather than
 *  at e2e or — worse — at production render. */
export const nowItemSchema = z.object({
  kind: z.enum(nowItemKinds),
  where: z.string().min(1),
  title: z.string().min(1),
  prose: z.string().min(1),
  detail: z.array(nowItemDetailSchema).length(3),
});
export type NowPageItem = z.infer<typeof nowItemSchema>;

/** Fixed item count. Six is the prototype design; locking it via
 *  `.length(NOW_ITEM_COUNT)` on the schema means a content edit
 *  that drops to five (or grows to seven) fails the build, not
 *  the user's eyes. Phase-2 content rewrites that intentionally
 *  change the count update this constant + the schema together. */
export const NOW_ITEM_COUNT = 6;

/** Narrows a `pages` collection entry to the discriminated-union
 *  variant whose `slug` is `'now'`. The Zod schema in
 *  `src/content.config.ts` already enforces `slug === 'now'` at
 *  build time for `pages/{en,es}/now.md`, so this throw can
 *  never fire at runtime — but it gives TypeScript the hook to
 *  narrow `entry.data.items` from optional to required, and
 *  produces a clear error message if a future contributor
 *  renames the markdown slug.
 *
 *  Generic over `E extends { data: { slug: string } }` rather
 *  than typed to `CollectionEntry<'pages'>` directly so this
 *  module stays Astro-import-free (and unit-testable in plain
 *  vitest). */
export function assertNowEntry<E extends { data: { slug: string } }>(
  entry: E,
): asserts entry is E & { data: { slug: 'now'; items: NowPageItem[] } } {
  if (entry.data.slug !== 'now') {
    throw new Error(`Expected pages entry with slug="now", got slug="${entry.data.slug}"`);
  }
}
