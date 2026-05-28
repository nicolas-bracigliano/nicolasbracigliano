// Single source of truth for the site's "kind" taxonomy. Before this
// existed, three independent enums lived in three files:
//   - works.kind         in src/content.config.ts   (code|print|music|garden)
//   - benchItemKinds     in src/lib/bench-items.ts  (code|guitar|garden|print)
//   - nowItemKinds       in src/lib/now-items.ts    (code|guitar|garden|print|coffee|read)
// They overlapped without aligning — works used `music` where bench/now
// used `guitar`, and a new kind meant three coordinated edits. Lifting
// the union here lets each collection pick its allowed subset while
// staying in sync on the shared values.
//
// Pure TS — no Astro framework imports — so this file is unit-testable
// in plain vitest and importable from the content schema, components,
// and tests alike.

/** Every kind value used across the site. Order is conventional, not
 *  load-bearing — render order is decided per consumer (CSS, array
 *  position, layout). */
export const CONTENT_KINDS = ['code', 'guitar', 'garden', 'print', 'coffee', 'read'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

/** Subset valid for the `works` collection. Works ship as deliverables,
 *  so `coffee` and `read` aren't kinds you "make" — they're activities
 *  the now page tracks. Includes `guitar` (renamed from the older
 *  `music` value) for alignment with bench/now. */
export const WORK_KINDS = ['code', 'guitar', 'garden', 'print'] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

/** Subset valid for home-page `bench` items. Identical to WORK_KINDS by
 *  design — the bench teases works in progress, so the kind taxonomy
 *  matches. Re-exported under its own name so future divergence (e.g.
 *  if bench grows a kind that isn't a shippable work) is a one-line
 *  change here, not a refactor across consumers. */
export const BENCH_KINDS = WORK_KINDS;
export type BenchKind = WorkKind;

/** Subset valid for now-page items. The full set: now narrates
 *  everything on the bench (works) plus the ambient activities
 *  (coffee, reading) that don't ship. */
export const NOW_KINDS = CONTENT_KINDS;
export type NowKind = ContentKind;

/** Subset valid for the `notes` collection's optional `kind:` field.
 *  Replaces the old `glyph:` enum — a note's kind selects a small
 *  decorative glyph from the registry (`src/lib/art-registry.ts`).
 *  Notes may omit `kind:` (no glyph rendered). `print` and `read` are
 *  absent because no glyph is registered for them yet — expand both
 *  this tuple and the registry to add one. */
export const NOTE_KINDS = ['code', 'guitar', 'garden', 'coffee'] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];
