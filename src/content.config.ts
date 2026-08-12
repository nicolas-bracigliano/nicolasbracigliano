import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 6+ deprecates the `z` re-export from `astro:content`; import from
// `astro/zod` instead.
import { z } from 'astro/zod';
// Shared schema for the /now route's bench-tour items. Defining it
// in `./lib/now-items` (vs inline here) lets `NowItem.astro` import
// the inferred TS types from the same source — no parallel
// hand-written `NowPageItem` interface to drift. Each item may carry an
// optional `teaser` block; the home page renders the teaser'd items as
// its "currently on the bench" grid, so `now.md` is the single source
// for both surfaces (replaces the old, separately-synced `home.md`
// `bench:` array, which had drifted from /now).
import { nowItemSchema, NOW_ITEM_MIN, NOW_ITEM_MAX } from './lib/now-items';
// Site-wide kind taxonomy. Per-collection subsets (`WORK_KINDS` etc.)
// are imported below where they're used.
import { WORK_KINDS, WORK_LIFECYCLES, NOTE_KINDS } from './lib/content-kinds';

const base = z.object({
  title: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  lang: z.enum(['en', 'es']),
  // Stable identifier pairing locale siblings (see ADR 0003). Format
  // is refined per collection below: notes & pieces use
  // `<slug>-<YYYY-MM-DD>`; works use `<slug>` alone.
  translationId: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  status: z.enum(['draft', 'published', 'retired']).default('draft'),
  tags: z
    .array(z.string().transform((t) => t.toLowerCase()))
    .max(3)
    .default([]),
  lede: z.string().max(160).optional(),
});

// `translationId` format is convention-bound but only partially verifiable
// per-file: the value is built from the EN sibling's slug, so on the ES
// file `translationId !== slug` — only the EN file's translationId can be
// equality-checked, and even then the date refinement reads the file's
// own date which equals the sibling's date by convention. To stay
// build-time-safe without cross-file lookups we validate the *pattern*
// here (catches malformed/typo'd values) and let
// `tests/unit/bilingual-pairs.test.ts` enforce the cross-file pairing.
const DATED_TRANSLATION_ID = /^[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/;
const SLUG_TRANSLATION_ID = /^[a-z0-9-]+$/;

// Use the full relative path (minus extension) as the entry id so that
// `pages/en/home.md` and `pages/es/home.md` don't collide on id "home".
const pathId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes', generateId: pathId }),
  schema: ({ image }) =>
    base
      .extend({
        /** Optional kind — selects a default decorative glyph from the
         *  per-kind maps in `src/components/ContentArt.astro`. Omit for
         *  no glyph. See ADR 0013. */
        kind: z.enum(NOTE_KINDS).optional(),
        /** Manual override; if omitted, NoteEntry/NoteDetail compute from
         *  `entry.body`. */
        minutes: z.number().int().positive().optional(),
        aside: z.string().optional(),
        /** Optional place for the detail-page footer (e.g. "Melbourne, AU").
         *  Mirrors pieces' `written`: author-supplied, localised per file;
         *  `NoteDetail.astro` omits the segment gracefully when absent. */
        noted: z.string().max(80).optional(),
        hero: image().optional(),
      })
      .refine((d) => DATED_TRANSLATION_ID.test(d.translationId), {
        message:
          'translationId shape must be <kebab-case>-<YYYY-MM-DD>; cross-locale pairing is enforced by tests/unit/bilingual-pairs.test.ts',
        path: ['translationId'],
      }),
});

// Iteration / changelog date shape: YYYY-MM or YYYY-MM-DD. Both are valid
// `<time datetime>` values, so the layout passes the raw string through to
// the attribute and renders the "2026 · 05" display form via a join.
const WORK_REV_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works', generateId: pathId }),
  schema: ({ image }) =>
    base
      .extend({
        specs: z.record(z.string(), z.string()).default({}),
        /** Medium category — drives both the works-page filter buttons and
         *  the *default* WorkCard art vignette when `art` is unset. Subset
         *  of the site-wide ContentKind taxonomy (see
         *  `src/lib/content-kinds.ts`). */
        kind: z.enum(WORK_KINDS).default('code'),
        /** Work lifecycle — distinct from `status` (publish-state). Renders as
         *  a coloured dot + label in the WorkCard foot. */
        lifecycle: z.enum(WORK_LIFECYCLES).default('shipping'),
        /** Display number (e.g. "07") used in the card meta row. Keeps the
         *  catalog flavour — "№ 07" reads like an entry in a hand-kept ledger. */
        number: z.string().optional(),
        hero: image().optional(),
        /** Optional caption under the detail-page hero figure. Editorial
         *  aside, not alt text (the art is aria-hidden in ContentArt).
         *  Localised per file. */
        heroCaption: z.string().max(160).optional(),
        /** Designed revisions — the "how it changed" ledger. Distinct from
         *  `changelog` (running updates): an iteration is a deliberate
         *  version with a `rev` label, an optional lifecycle chip, and a
         *  one-line rationale. A work may have neither list, one, or both.
         *  Capped at 12 — a longer history belongs in a piece. */
        iterations: z
          .array(
            z.object({
              rev: z.string().max(16),
              date: z.string().regex(WORK_REV_DATE, 'iteration date must be YYYY-MM or YYYY-MM-DD'),
              status: z.enum(WORK_LIFECYCLES).optional(),
              note: z.string().max(200),
            }),
          )
          .max(12)
          .default([]),
        /** Running updates for ongoing works — one line each. Newest-first
         *  is the authoring convention; the layout does not sort. */
        changelog: z
          .array(
            z.object({
              date: z.string().regex(WORK_REV_DATE, 'changelog date must be YYYY-MM or YYYY-MM-DD'),
              note: z.string().max(200),
            }),
          )
          .max(20)
          .default([]),
        /** Related links — repo, files, a piece about the work. `href` is a
         *  plain bounded string (NOT z.string().url()): the list mixes
         *  external URLs and site-internal paths like `/en/pieces/…`. */
        elsewhere: z
          .array(
            z.object({
              label: z.string().max(60),
              href: z.string().min(1).max(300),
              note: z.string().max(80).optional(),
            }),
          )
          .max(8)
          .default([]),
      })
      .refine((d) => SLUG_TRANSLATION_ID.test(d.translationId), {
        message:
          'translationId shape must be kebab-case with no date suffix; cross-locale pairing is enforced by tests/unit/bilingual-pairs.test.ts',
        path: ['translationId'],
      }),
});

// `pieces` (EN) · `ensayos` (ES) — long-form route. The collection
// name follows the EN slug per ADR 0010. Schema extends `base` with:
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
    base
      .extend({
        /** Manual reading-time override; if omitted, PieceEntry computes
         *  from `entry.body`. Same convention as notes. */
        minutes: z.number().int().positive().optional(),
        /** Optional editorial "PLACE, in SEASON" suffix for the slug-page
         *  meta line — rendered as `DATE · written in <written>`. Per ADR
         *  0012, author-supplied; the layout omits the suffix gracefully
         *  when absent. Localised per piece (EN: "Melbourne, in autumn";
         *  ES: "Melbourne, en otoño"). */
        written: z.string().optional(),
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
        // Diagram placements. Three rendering positions are supported:
        //
        //   `place: 'top'`     — between lede and prose (default; the
        //                        establishing visual)
        //   `place: 'bottom'`  — between prose and foot (detail/reference)
        //   `after: '<slug>'`  — inline, immediately after a specific
        //                        heading in the prose. The slug matches
        //                        the heading's auto-generated anchor ID
        //                        (Astro slugifies `## Why rings` to
        //                        `why-rings`).
        //
        // The top/bottom split solves the "wall of SVG before any prose"
        // failure mode for the average multi-diagram piece. `after` is
        // the escape hatch for pieces that genuinely need a diagram
        // interleaved between two specific paragraphs — kept off the
        // hot path so the registry layer remains the simple case.
        //
        // `place` and `after` are mutually exclusive. Inline rendering
        // (`after`) requires a rehype plugin that's NOT YET WIRED — the
        // first piece that uses it ships the plugin alongside. Until
        // then, an `after`-marked diagram throws at build time with a
        // clear message rather than silently rendering in the wrong
        // position. See `src/layouts/PieceLayout.astro` for the guard.
        //
        // i18n coupling: `after` references the slug of an Astro-
        // generated heading anchor, which is derived from the heading
        // TEXT. So the same conceptual diagram needs different `after`
        // values per locale — the EN piece's `## Why rings` (slug
        // `why-rings`) and the ES piece's `## Por qué círculos y no cajas`
        // (slug `por-que-circulos-y-no-cajas`) reference the same diagram
        // with different keys. Translation pairs must keep these in sync;
        // there's no schema-level enforcement.
        diagrams: z
          .array(
            z
              .object({
                key: z.string(),
                place: z.enum(['top', 'bottom']).default('top'),
                after: z
                  .string()
                  .regex(/^[a-z0-9-]+$/, 'after must be a kebab-case heading anchor slug')
                  .optional(),
                caption: z.string().max(120).optional(),
              })
              .refine((d) => !(d.after !== undefined && d.place !== 'top'), {
                message:
                  'diagram entries may set `place` OR `after`, not both — `after` implies inline placement',
              }),
          )
          .default([]),
        hero: image().optional(),
      })
      .refine((d) => DATED_TRANSLATION_ID.test(d.translationId), {
        message:
          'translationId shape must be <kebab-case>-<YYYY-MM-DD>; cross-locale pairing is enforced by tests/unit/bilingual-pairs.test.ts',
        path: ['translationId'],
      }),
});

// `pages` collection: one Zod variant per known page slug, joined
// by `z.discriminatedUnion('slug', …)`. Each variant locks `slug`
// to a literal so TypeScript narrows `entry.data` based on a
// slug check at the call site — that's how the /now page knows
// `entry.data.items` is present without any optional fallback,
// and how the home / about / build pages get a guarantee that
// `items` ISN'T present (a stray `items:` accidentally added to
// home.md fails Zod validation, loudly, at build time).
//
// No `translationId` refinement on pages by design: pages are a
// fixed closed set (PAGE_SLUGS in `lib/routes.ts`) and use the
// slug as the id verbatim (`home`, `about`, …). The page-slugs
// drift test enforces existence in both locales; a format check
// would be redundant.
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
    };
    return z.discriminatedUnion('slug', [
      // The home variant no longer carries a `bench:` array — the home
      // page's "currently on the bench" grid is now derived from the
      // teaser'd items on the `now` variant below (single source).
      base.extend({ slug: z.literal('home'), ...common }),
      base.extend({ slug: z.literal('about'), ...common }),
      base.extend({ slug: z.literal('build'), ...common }),
      base.extend({
        slug: z.literal('now'),
        ...common,
        /** Required on the now variant. Feeds both the full /now tour and
         *  (for teaser'd items) the home bench grid. Bounded to
         *  NOW_ITEM_MIN..NOW_ITEM_MAX so a content edit that empties or
         *  overflows the list fails Zod at build time; each item's shape
         *  (incl. the optional teaser's kind-conditional captions) is
         *  validated by `nowItemSchema` in `src/lib/now-items.ts`. */
        items: z.array(nowItemSchema).min(NOW_ITEM_MIN).max(NOW_ITEM_MAX),
      }),
    ]);
  },
});

export const collections = { notes, works, pieces, pages };
