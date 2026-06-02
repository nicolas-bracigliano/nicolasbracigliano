// Single source of truth for the /now route's bench-tour items — and,
// via each item's optional `teaser` + `benchItemsFrom` below, for the
// home page's "currently on the bench" grid as well (see ADR 0014).
// `src/content.config.ts` uses the Zod schema below to validate
// the `items: …` frontmatter on `src/content/pages/{en,es}/now.md`;
// `src/components/NowItem.astro` and the home index pages use the
// inferred TypeScript types. Either side is free to evolve — the
// others follow automatically because all reach into this module.
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
import { NOW_KINDS, BENCH_KINDS, type BenchKind, type NowKind } from './content-kinds';
import type { Locale } from './routes';

/** One row of an item's detail `<dl>`. `dt` is the term label,
 *  `dd` the description. Names mirror the rendered HTML so the
 *  page's `<dl><dt><dd>` is structurally obvious. */
export const nowItemDetailSchema = z.object({
  dt: z.string().min(1),
  dd: z.string().min(1),
});
export type NowItemDetailRow = z.infer<typeof nowItemDetailSchema>;

// The kinds the home bench can render — the BENCH_KINDS subset of the /now
// taxonomy (the bench has no coffee/read vignette). Declared as
// ReadonlySet<string> so `.has` accepts any NowKind without a cast:
// BenchKind ⊆ NowKind, so the widening is sound. Used by both the teaser
// refine on nowItemSchema and benchItemsFrom, so the rule lives in one place.
const BENCH_KIND_SET: ReadonlySet<string> = new Set(BENCH_KINDS);

/** Type guard: can the home bench render this kind? */
function isBenchKind(kind: NowKind): kind is BenchKind {
  return BENCH_KIND_SET.has(kind);
}

/** Optional bench-teaser block. Present only on the items that also
 *  surface on the home page's "currently on the bench" grid; `benchItemsFrom`
 *  (below) selects the teaser'd items, while `/now` renders every item.
 *  This is the single-source replacement for the old, separately
 *  hand-maintained `bench:` array on `home.md` (the two drifted — see
 *  [ADR 0014](../../docs/decisions/0014-bench-now-single-source.md)).
 *  `label` is the localized eyebrow word (EN "code" / ES "código"; "3d"
 *  for print). `line` is the short bench blurb shown under the title — an
 *  explicit field (not derived from `prose`) so the author controls the
 *  teaser cut; it reads terser than the full `prose` paragraph and may be
 *  a verbatim lede excerpt of it. `guitarLabel` / `seedlingTag` are the
 *  captions baked into the guitar and seedling vignettes —
 *  kind-conditionally required by the refines below. The bench card's
 *  title reuses the item's own `title`, so it is not duplicated here. */
export const nowTeaserSchema = z.object({
  label: z.string().min(1),
  line: z.string().min(1),
  guitarLabel: z.string().min(1).optional(),
  seedlingTag: z.string().min(1).optional(),
});
export type NowTeaser = z.infer<typeof nowTeaserSchema>;

/** Full item shape. Each item carries exactly three detail rows
 *  (locked via `.length(3)`); the prototype design has shipped
 *  with three since day one, and locking the count catches an
 *  accidental row deletion at Zod-validation time rather than
 *  at e2e or — worse — at production render.
 *
 *  The optional `teaser` (above) is gated by the refines: it may only
 *  sit on a `BENCH_KINDS` kind (the home bench has no coffee/read
 *  vignette), and guitar/garden teasers require their vignette caption —
 *  exactly the kind-conditional rules the retired `benchItemSchema`
 *  used to enforce. */
export const nowItemSchema = z
  .object({
    kind: z.enum(NOW_KINDS),
    where: z.string().min(1),
    title: z.string().min(1),
    prose: z.string().min(1),
    detail: z.array(nowItemDetailSchema).length(3),
    teaser: nowTeaserSchema.optional(),
    /** Optional cross-link to a `works` item — the bench update that has
     *  graduated into a catalogued work (e.g. the `code` item ↔ the
     *  "This site" work). Holds the work's `translationId` (the shared,
     *  cross-locale identifier — NOT a locale slug), so the same value
     *  works verbatim in `now.md` for both locales; the page resolves it
     *  to the localized `/works/<slug>` route per locale (EN `this-site`
     *  / ES `este-sitio`) via `entryRouteFor`. Same kebab-case shape the
     *  works collection's translationId uses. A reference that points at
     *  no published work fails the build (see the now index pages) — a
     *  now item must never dangle a "see also" at a missing or draft
     *  work. Only the full /now tour renders the link; the home bench
     *  teaser deliberately doesn't (kept terse). */
    work: z
      .string()
      .regex(/^[a-z0-9-]+$/, "work must be a related work's translationId (kebab-case, no date)")
      .optional(),
  })
  .refine((i) => !i.teaser || isBenchKind(i.kind), {
    message: 'teaser is only valid on a bench kind (code/guitar/garden/print/home)',
    path: ['teaser'],
  })
  .refine((i) => !i.teaser || i.kind !== 'guitar' || i.teaser.guitarLabel !== undefined, {
    message: 'guitar teaser requires `guitarLabel`',
    path: ['teaser', 'guitarLabel'],
  })
  .refine((i) => !i.teaser || i.kind !== 'garden' || i.teaser.seedlingTag !== undefined, {
    message: 'garden teaser requires `seedlingTag`',
    path: ['teaser', 'seedlingTag'],
  });
export type NowPageItem = z.infer<typeof nowItemSchema>;

/** Item-count bounds. Was a fixed six (one per kind) before bench
 *  unification; relaxed to a range now that the same list feeds both the
 *  home bench teaser and the full /now tour, so the content can grow or
 *  shrink within reason without a schema edit. Enforced on the `items`
 *  array in `src/content.config.ts` via `.min(NOW_ITEM_MIN).max(NOW_ITEM_MAX)`. */
export const NOW_ITEM_MIN = 4;
export const NOW_ITEM_MAX = 8;

/** The shape the home-page bench grid consumes, derived from the teaser'd
 *  /now items by `benchItemsFrom`. `kind` is narrowed to a BENCH_KINDS
 *  kind (the bench has no coffee/read vignette); `title` is the now item's
 *  own title; the rest come from its `teaser`. */
export interface BenchItem {
  kind: BenchKind;
  label: string;
  title: string;
  line: string;
  guitarLabel?: string | undefined;
  seedlingTag?: string | undefined;
}

/** Derive the home page's "currently on the bench" items from the /now
 *  items — the ones carrying a `teaser`, in document order. now.md is the
 *  single source for both surfaces: `/now` renders every item, the bench
 *  renders these. Kept here (not inline in the two index pages) so the
 *  filter + BENCH_KINDS narrowing live in one unit-tested place, and the
 *  pages stay declarative. See [ADR 0014]. */
export function benchItemsFrom(items: readonly NowPageItem[]): BenchItem[] {
  return items.flatMap((i) =>
    i.teaser && isBenchKind(i.kind)
      ? [
          {
            kind: i.kind,
            label: i.teaser.label,
            title: i.title,
            line: i.teaser.line,
            guitarLabel: i.teaser.guitarLabel,
            seedlingTag: i.teaser.seedlingTag,
          },
        ]
      : [],
  );
}

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
/** Visible label for a /now → /works "see also" link: a work's localized
 *  route with its leading `/en|/es` locale segment and trailing slash
 *  stripped, e.g. `/en/works/this-site/` → `/works/this-site` (ES:
 *  `/es/obras/este-sitio/` → `/obras/este-sitio`). The full route stays
 *  the link's `href`; this is only the monospaced path shown to the
 *  reader, matching the prototype's `/works/<slug>` foot link. Pure (no
 *  Astro import) so it's unit-tested alongside the schema; the now index
 *  pages build the route via `entryRouteFor` and pass both through to
 *  `NowItem`. */
export function workLinkLabel(route: string): string {
  return route.replace(/^\/(?:en|es)(?=\/)/, '').replace(/\/$/, '');
}

/** A resolved /now → /works "see also" link. `href` is the full localized
 *  route ("/en/works/this-site/"); `label` is its reader-facing path
 *  ("/works/this-site", via `workLinkLabel`). */
export interface NowWorkLink {
  href: string;
  label: string;
}

/** Resolve each now item's optional `work` cross-link against a
 *  `translationId → full /works route` map (the published works for one
 *  locale, built by the caller). Returns one entry per item, aligned
 *  index-for-index, `null` where the item set no `work`.
 *
 *  THROWS if a `work` ref isn't in the map — a now item must not dangle a
 *  "see also" at a missing or draft work, so the /now build fails loudly
 *  rather than the reader hitting a dead link. (Because a work going
 *  `draft` in one locale removes it from that locale's map, this is the
 *  point where that lifecycle change surfaces — by design.)
 *
 *  Pure (no Astro import) so the resolution rule, including the throw, is
 *  unit-tested here in plain vitest; the content-layer I/O that builds the
 *  map lives in `i18n.resolveWorkLinks`, which delegates to this. */
export function nowWorkLinks(
  items: readonly NowPageItem[],
  routeByTranslationId: ReadonlyMap<string, string>,
  locale: Locale,
): (NowWorkLink | null)[] {
  return items.map((item) => {
    if (!item.work) return null;
    const route = routeByTranslationId.get(item.work);
    if (route === undefined) {
      throw new Error(
        `now item "${item.title}" references work translationId="${item.work}", ` +
          `which has no published ${locale} work`,
      );
    }
    return { href: route, label: workLinkLabel(route) };
  });
}

export function assertNowEntry<E extends { data: { slug: string } }>(
  entry: E,
): asserts entry is E & { data: { slug: 'now'; items: NowPageItem[] } } {
  if (entry.data.slug !== 'now') {
    throw new Error(`Expected pages entry with slug="now", got slug="${entry.data.slug}"`);
  }
}
