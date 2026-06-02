// Assembles the home page's "Latest entries" feed — the latest two of
// each kind (work, piece, note) shown under the bench. Kept here (not
// inline in the two index pages) so the select/sort/group has one tested
// home, and so the set of feed kinds is a single source of truth.
//
// Astro-free on purpose (same rationale as `now-items.ts`): generic over
// the minimal `{ data: { date } }` shape
// it actually uses, so it's unit-testable in plain vitest without the
// content layer, and it doesn't couple to `astro:content`.

/** The feed kinds, in the order they're grouped on the page. This order
 *  matches the ⌘K palette's content grouping (`KIND_ORDER` in
 *  `cmdk-match.ts`: work → piece → note) so the two surfaces agree.
 *  `LatestKind` (below) derives from this; `LatestEntries.astro` imports
 *  it for its pill labels; `buildLatest` iterates it so the grouped
 *  output order has a single source of truth. The test asserts coverage. */
export const LATEST_KINDS = ['work', 'piece', 'note'] as const;
export type LatestKind = (typeof LATEST_KINDS)[number];

/** How many entries of each kind the home feed shows. */
export const LATEST_PER_KIND = 2;

/** Minimal entry shape buildLatest needs: a sortable date plus an `id`
 *  to break date ties deterministically. Keeps the helper framework-free
 *  (no `astro:content` dependency) — `CollectionEntry` already satisfies
 *  both fields. */
type Dated = { id: string; data: { date: Date } };

/** Select the latest `perKind` entries of each kind, newest-first within
 *  each kind, then concatenate the groups in `LATEST_KINDS` order
 *  (work → piece → note). So every kind keeps a presence on the home
 *  page instead of a busy kind crowding the others out.
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
  perKind = LATEST_PER_KIND,
): { entry: N | W | P; kind: LatestKind }[] {
  const groups: { work: readonly W[]; piece: readonly P[]; note: readonly N[] } = {
    work: byKind.work,
    piece: byKind.piece,
    note: byKind.note,
  };
  return LATEST_KINDS.flatMap((kind) =>
    [...groups[kind]]
      // Newest first, then by id as a stable tie-break: same-date entries
      // (e.g. two notes dated the same day) would otherwise fall back to
      // getCollection's order, which Astro doesn't guarantee across builds.
      .sort((a, b) => +b.data.date - +a.data.date || a.id.localeCompare(b.id))
      .slice(0, perKind)
      .map((entry) => ({ entry, kind })),
  );
}
