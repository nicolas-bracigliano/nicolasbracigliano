// Assembles the home page's "Latest entries" feed — the chronological
// mix of notes, works, and pieces shown under the bench. Kept here (not
// inline in the two index pages) so the merge/sort/slice has one tested
// home, and so the set of feed kinds is a single source of truth.
//
// Astro-free on purpose (same rationale as `now-items.ts` /
// `bench-items.ts`): generic over the minimal `{ data: { date } }` shape
// it actually uses, so it's unit-testable in plain vitest without the
// content layer, and it doesn't couple to `astro:content`.

/** The feed kinds, in no particular order. Single source of truth —
 *  `LatestEntries.astro` imports `LatestKind` from here for its pill
 *  labels, and `buildLatest` keys its input on this set so every kind
 *  must be wired (see below). Exported as a const tuple so the test can
 *  assert coverage. */
export const LATEST_KINDS = ['note', 'work', 'piece'] as const;
export type LatestKind = (typeof LATEST_KINDS)[number];

/** How many entries the home feed shows. */
export const LATEST_LIMIT = 4;

/** Minimal entry shape buildLatest needs — just a sortable date. Keeps
 *  the helper framework-free (no `astro:content` dependency). */
type Dated = { data: { date: Date } };

/** Merge per-kind entry lists into one newest-first feed, capped at
 *  `limit`.
 *
 *  The `byKind` parameter is keyed on the full `LatestKind` set, which is
 *  a deliberate guard: callers MUST supply an array for every kind, so
 *  dropping one (e.g. forgetting to fetch `pieces`) is a compile error,
 *  not a silent gap — and adding a future kind to `LATEST_KINDS` forces
 *  every call site to wire it. It guards *omission*, not mislabeling
 *  (`{ note: pieces }` still type-checks).
 *
 *  Generic over the record `T` (not a single element type) so the result
 *  entry infers to the *union* of the per-kind entry types — callers pass
 *  `CollectionEntry<'notes'>[]` / `<'works'>[]` / `<'pieces'>[]` and get
 *  back the union they expect, while the helper itself only relies on
 *  `Dated`. */
export function buildLatest<T extends Record<LatestKind, readonly Dated[]>>(
  byKind: T,
  limit = LATEST_LIMIT,
): { entry: T[LatestKind][number]; kind: LatestKind }[] {
  type Item = { entry: T[LatestKind][number]; kind: LatestKind };
  return (Object.entries(byKind) as [LatestKind, readonly T[LatestKind][number][]][])
    .flatMap(([kind, entries]) => entries.map((entry): Item => ({ entry, kind })))
    .sort((a, b) => +b.entry.data.date - +a.entry.data.date)
    .slice(0, limit);
}
