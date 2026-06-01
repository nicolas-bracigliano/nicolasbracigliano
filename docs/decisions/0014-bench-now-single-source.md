# 0014 — `now.md` is the single source for both the home bench and `/now`

**Status**: Accepted
**Date**: 2026-05-31

## Context

The home page's "currently on the bench" grid and the `/now` page describe the
same thing — what's on the bench right now — but were two separately
hand-maintained data sources (`home.md` `bench:` and `now.md` `items:`), kept
aligned only by a "keep these in sync" comment. In practice they drifted: a
craft was described differently on each surface, and the two language siblings
diverged from each other too.

## Decision

`now.md` is the single source for both surfaces.

- Each `/now` item may carry an optional `teaser`
  (`{ label, line, guitarLabel?, seedlingTag? }`). Items with a teaser appear on
  the home bench; every item appears on `/now`.
- `nowItemSchema` validates the teaser, with refines that keep it valid only on
  a `BENCH_KINDS` kind (the bench has no coffee/read vignette) and require the
  guitar/garden vignette captions.
- `benchItemsFrom(items)` derives the typed `BenchItem[]` the bench renders,
  using a runtime `isBenchKind` guard (shared with the schema refine) rather
  than a cast. The home pages render the result through one `Bench.astro`
  component.
- The bench card reuses the now item's own `title`; only the short `line` and
  the vignette captions are teaser-specific.

The per-route treatment (design-system §3) is unchanged — home is still a
vignette grid, `/now` still a numbered tour. Only the data plumbing is unified.

## Alternatives considered

| Option                                | Why not                                                                                                                                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep two sources, add a CI sync check | Tests the symptom. Two sources for one idea is the problem; a linter nagging about drift is worse than removing one of the sources.                                                                                                    |
| Source the bench from `/works`        | `/works` is finished/ongoing artifacts; the bench is current activity across every craft (incl. coffee, reading). Sourcing from works drops the daily-life crafts from the front door and weakens "one maker, many crafts" (§1, §4.2). |
| Derive the bench `line` from `prose`  | A first-sentence heuristic is unreliable (one item's first sentence is a single word). An explicit `line` lets the author control the teaser cut.                                                                                      |
| Add a separate bench `title`          | Reintroduces a second hand-maintained field per item — the drift this ADR removes. Reusing the now title is the point.                                                                                                                 |

## Consequences

- One source, no sync: the bench is by construction a subset of `/now`, so the
  two surfaces cannot drift.
- `nowItemSchema` owns the shape; `benchItemsFrom` is unit-tested directly.
- BenchCard stays specialised — it bakes per-instance captions into its inline
  SVG — consistent with [ADR 0013](./0013-per-entry-art.md).
- A craft is on the bench iff its `/now` item has a `teaser`, so adding or
  removing a bench card is a one-file content edit, not a code change.

References: [ADR 0013](./0013-per-entry-art.md),
[ADR 0003](./0003-mirrored-bilingual-routes.md).
