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
 *  display order on the /now page. */
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
