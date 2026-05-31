// Assembles the home page's "Latest entries" feed — the chronological
// mix of notes, works, and pieces shown under the bench. Kept here (not
// inline in the two index pages) so the merge/sort/slice has one tested
// home, and so the set of feed kinds is a single source of truth.
//
// Astro-free on purpose (same rationale as `now-items.ts`): generic over
// the minimal `{ data: { date } }` shape
// it actually uses, so it's unit-testable in plain vitest without the
// content layer, and it doesn't couple to `astro:content`.

/** The feed kinds. `LatestKind` (below) derives from this, and
 *  `LatestEntries.astro` imports it for its pill labels. Exported as a
 *  const tuple so the test can assert coverage; the `note`/`work`/`piece`
 *  literals in `buildLatest` are members of this set. */
export const LATEST_KINDS = ['note', 'work', 'piece'] as const;
export type LatestKind = (typeof LATEST_KINDS)[number];

/** How many entries the home feed shows. */
export const LATEST_LIMIT = 4;

/** Minimal entry shape buildLatest needs — just a sortable date. Keeps
 *  the helper framework-free (no `astro:content` dependency). */
type Dated = { data: { date: Date } };

/** Merge the home feed's note/work/piece entry lists into one
 *  newest-first feed, capped at `limit`.
 *
 *  `byKind` requires all three keys — a deliberate guard: dropping one
 *  (e.g. forgetting to fetch `pieces`) is a compile error, not a silent
 *  gap. Adding a future kind means widening this signature, a visible
 *  compile-checked edit. It guards *omission*, not mislabeling
 *  (`{ note: pieces }` still type-checks).
 *
 *  Generic over the three entry types (N/W/P) so the result entry infers
 *  to their union — callers pass `CollectionEntry<'notes'>[]` /
 *  `<'works'>[]` / `<'pieces'>[]` and get the union back, while the helper
 *  itself only relies on `Dated`. */
export function buildLatest<N extends Dated, W extends Dated, P extends Dated>(
  byKind: { note: readonly N[]; work: readonly W[]; piece: readonly P[] },
  limit = LATEST_LIMIT,
): { entry: N | W | P; kind: LatestKind }[] {
  return [
    ...byKind.note.map((entry) => ({ entry, kind: 'note' as const })),
    ...byKind.work.map((entry) => ({ entry, kind: 'work' as const })),
    ...byKind.piece.map((entry) => ({ entry, kind: 'piece' as const })),
  ]
    .sort((a, b) => +b.entry.data.date - +a.entry.data.date)
    .slice(0, limit);
}
