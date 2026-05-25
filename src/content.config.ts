import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 6 deprecates the `z` re-export from `astro:content`; import from
// `astro/zod` instead (Astro 6 ships zod v4).
import { z } from 'astro/zod';
// Shared schema for the /now route's bench-tour items. Defining it
// in `./lib/now-items` (vs inline here) lets `NowItem.astro` import
// the inferred TS types from the same source — no parallel
// hand-written `NowPageItem` interface to drift.
import { nowItemSchema, NOW_ITEM_COUNT } from './lib/now-items';

const base = z.object({
  title: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  lang: z.enum(['en', 'es']),
  translationKey: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  status: z.enum(['draft', 'published', 'retired']).default('draft'),
  tags: z
    .array(z.string().transform((t) => t.toLowerCase()))
    .max(3)
    .default([]),
  lede: z.string().max(160).optional(),
});

// Use the full relative path (minus extension) as the entry id so that
// `pages/en/home.md` and `pages/es/home.md` don't collide on id "home".
const pathId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      glyph: z.enum(['garden', 'code', 'guitar', 'coffee', 'none']).default('none'),
      /** Manual override; if omitted, NoteEntry computes from `entry.body`. */
      minutes: z.number().int().positive().optional(),
      aside: z.string().optional(),
      hero: image().optional(),
      ogOverride: image().optional(),
    }),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      repo: z.url().optional(),
      specs: z.record(z.string(), z.string()).default({}),
      /** Medium category — drives both the works-page filter buttons and
       *  the *default* WorkCard art vignette when `art` is unset. */
      kind: z.enum(['code', 'print', 'music', 'garden']).default('code'),
      /** Specific art vignette for this work. When unset, WorkArt falls
       *  back to the kind-default. Adding a new variant: extend this enum
       *  and add a matching block in `src/components/WorkArt.astro`. */
      art: z
        .enum(['terminal', 'font-specimen', 'tray', 'capo', 'knob', 'waveform', 'garden-plot'])
        .optional(),
      /** Work lifecycle — distinct from `status` (publish-state). Renders as
       *  a coloured dot + label in the WorkCard foot. */
      lifecycle: z.enum(['shipping', 'ongoing', 'draft', 'archived']).default('shipping'),
      /** Display number (e.g. "07") used in the card meta row. Keeps the
       *  catalog flavour — "№ 07" reads like an entry in a hand-kept ledger. */
      number: z.string().optional(),
      hero: image().optional(),
      ogOverride: image().optional(),
    }),
});

// `pieces` (EN) · `ensayos` (ES) — long-form route. The collection
// name follows the EN slug per ADR 0010. Schema extends `base` with:
//   - `series` — optional grouping for multi-part pieces
//   - `marginNotes` — array of section-anchored asides; pieces have
//     N>1 by design (compared to notes' single optional `aside`).
//     Each note's text is plain text, max 180 chars; if longer, the
//     thought should be a paragraph in the body. Capped at 8 per
//     piece — more than that is a structural smell.
//   - `diagrams` — declarative list of registered SVG diagram keys
//     to render in the piece (resolved at build time by
//     `src/components/DiagramRail.astro`). Pure markup; no MDX —
//     see ADR 0010 + the inline rationale in DiagramRail.
const pieces = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pieces', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      series: z.string().optional(),
      /** Manual reading-time override; if omitted, PieceEntry computes
       *  from `entry.body`. Same convention as notes. */
      minutes: z.number().int().positive().optional(),
      marginNotes: z
        .array(
          z.object({
            section: z.string(),
            text: z.string().max(180),
            mark: z.string().max(2).optional(),
          }),
        )
        .max(8)
        .default([]),
      // Diagram placements. `place` distributes diagrams between the
      // top-of-prose rail and a bottom-of-prose rail so a multi-diagram
      // piece (the C4 essay has 5+) doesn't pile every SVG above the
      // first paragraph. `top` is the establishing visual; `bottom` is
      // detail/reference. `caption` is an optional figcaption rendered
      // beneath the SVG.
      diagrams: z
        .array(
          z.object({
            key: z.string(),
            place: z.enum(['top', 'bottom']).default('top'),
            caption: z.string().max(120).optional(),
          }),
        )
        .default([]),
      hero: image().optional(),
      ogOverride: image().optional(),
    }),
});

// `pages` collection: one Zod variant per known page slug, joined
// by `z.discriminatedUnion('slug', …)`. Each variant locks `slug`
// to a literal so TypeScript narrows `entry.data` based on a
// slug check at the call site — that's how the /now page knows
// `entry.data.items` is present without any optional fallback,
// and how the home / about / colophon pages get a guarantee that
// `items` ISN'T present (a stray `items:` accidentally added to
// home.md fails Zod validation, loudly, at build time).
//
// Adding a new page (e.g. /pieces) when the route gets its own
// pages-collection entry: append the slug to `PAGE_SLUGS` in `lib/routes.ts`,
// add a matching variant below with `slug: z.literal('…')`, and
// ship the markdown files in `src/content/pages/{en,es}/`. The
// drift test in `tests/unit/page-slugs.test.ts` fails until all
// three are in sync. Cross-cutting fields (title, lang, status,
// …) live in `base` and extend automatically through `.extend()`.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages', generateId: pathId }),
  schema: ({ image }) => {
    const common = {
      hero: image().optional(),
      ogOverride: image().optional(),
    };
    return z.discriminatedUnion('slug', [
      base.extend({ slug: z.literal('home'), ...common }),
      base.extend({ slug: z.literal('about'), ...common }),
      base.extend({ slug: z.literal('colophon'), ...common }),
      base.extend({
        slug: z.literal('now'),
        ...common,
        /** Required on the now variant — only the now page has
         *  bench-tour items. Locked to `NOW_ITEM_COUNT` (6) so an
         *  accidental row deletion fails Zod validation at build
         *  time. Phase-2 content rewrites that intentionally
         *  change the count update the constant + this line. */
        items: z.array(nowItemSchema).length(NOW_ITEM_COUNT),
      }),
    ]);
  },
});

export const collections = { notes, works, pieces, pages };
