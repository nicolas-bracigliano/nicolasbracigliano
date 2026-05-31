# 0014 — `now.md` is the single source for both the home bench and `/now`

**Status**: Accepted
**Date**: 2026-05-31

## Context

The home page's "currently on the bench" grid and the `/now` page describe
the same thing — what Nicolás is working on right now — but they were two
separate, hand-synced data sources:

- `src/content/pages/{en,es}/home.md` carried a `bench:` array (terse, ~4
  items), validated by `benchItemSchema` in `src/lib/bench-items.ts`.
- `src/content/pages/{en,es}/now.md` carried an `items:` array (rich prose
  with a 3-row detail `<dl>`, ~6 items), validated by `nowItemSchema` in
  `src/lib/now-items.ts`.

Both files literally carried a comment telling the author to "keep the two
in sync." They had not stayed in sync:

- EN `home.md` guitar read "Learning the basics … eight essential chords"
  while `/now` read "Bars 9–16 of Milonga del Ángel" (Piazzolla). The 3D
  item was a different object on each surface (gridfinity bins vs the
  catch-all tray).
- EN and ES `home.md` had drifted from **each other** too: the ES bench
  already carried the Piazzolla / tomato / tray content; the EN bench was
  stale.

Two schemas, two collections-union branches, two unit tests, two markdown
arrays — all to express one idea. The sync was manual and had failed.

## Decision

`now.md` becomes the **single source** for both surfaces.

- Each `/now` item may carry an optional `teaser` block:
  `{ label, line, guitarLabel?, seedlingTag? }`. Items with a teaser appear
  on the home bench; **all** items appear on `/now`.
- `nowItemSchema` (`src/lib/now-items.ts`) absorbs the teaser, with refines
  that reproduce the retired `benchItemSchema`'s guarantees: a teaser is
  valid only on a `BENCH_KINDS` kind (the bench has no coffee/read
  vignette), a guitar teaser requires `guitarLabel`, a garden teaser
  requires `seedlingTag`.
- `benchItemsFrom(items)` (same module) derives the typed `BenchItem[]` the
  home page renders — the filter + the BENCH_KINDS narrowing live in one
  unit-tested place, via a runtime `isBenchKind` guard rather than an `as`
  cast. The two index pages call it and stay declarative.
- The bench card's **title reuses the now item's own `title`**; only the
  short `line` and the vignette captions are teaser-specific. The
  fixed item count (was locked to 6) relaxes to `NOW_ITEM_MIN..NOW_ITEM_MAX`.
- `src/lib/bench-items.ts`, its schema, and `tests/unit/bench-items.test.ts`
  are deleted; the `home` variant of the `pages` collection union no longer
  carries `bench`.

This keeps the per-route treatment from design-system §3 unchanged (home is
still a vignette grid; `/now` is still a numbered tour) — only the data
plumbing is unified.

## What we accept

- **Stone & Wood leaves the home bench.** The old EN bench featured a
  `home`-kind "Stone & Wood" card that had no `/now` item. Under a single
  source, the bench shows the teaser'd `/now` items (code, guitar, garden,
  print). Stone & Wood already lives in `/works`; the bench is "lived
  activity," not a project list. This is a product change riding with the
  refactor, called out here deliberately.
- **Bench titles are now the `/now` titles** (e.g. "Rewriting my personal
  site in Astro" rather than "A personal static-site"). They read longer
  but more specific, and there is one title per subject instead of two.
- **`teaser.line` restates a slice of `prose`.** It is an explicit field
  (not derived) so the author controls the teaser cut; today the EN lines
  are verbatim lede excerpts of the prose, the ES lines are the author's
  prior bench copy. Bespoke shorter EN teasers are a follow-up for the
  voice track.

## Alternatives considered

| Option                                                   | Why not                                                                                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keep two sources, add a CI check that they stay in sync  | Tests the symptom, not the cause. Two sources for one idea is the problem; a linter that nags about it is worse than removing one.                                 |
| Bench sources from `/works` instead                      | Strips the daily-life crafts (coffee, guitar, garden) from the front door — `/works` is artifacts only. Weakens "one maker, many crafts" (design-system §1, §4.2). |
| Derive `teaser.line` from `prose` (first sentence)       | Unreliable: the guitar prose's first sentence is just "Piazzolla." An explicit line gives the author control over the cut.                                         |
| Add a `teaser.title` so the bench keeps its short titles | Reintroduces a second hand-maintained title per item — exactly the drift this ADR removes. Reusing the now title is the point.                                     |

## Consequences

- **One source, zero sync.** The bench is by construction a faithful subset
  of `/now`; the cross-language and cross-surface drift is gone.
- **One schema, one test home.** `nowItemSchema` owns the shape; the bench
  guarantees are its refines; `benchItemsFrom` is unit-tested directly.
- **BenchCard is untouched** — it still bakes `guitarLabel` / `seedlingTag`
  into its inline SVG, consistent with [ADR 0013](./0013-per-entry-art.md)'s
  "BenchCard stays specialised" note.
- **The version eyebrow** moved to `src/lib/version.ts` (read from
  package.json) in the same change, so it can't go stale (it had hardcoded
  v.1.11.1 while package.json was 1.13.0).

References: [ADR 0013](./0013-per-entry-art.md) (BenchCard specialisation),
[ADR 0003](./0003-mirrored-bilingual-routes.md) (mirrored bilingual routes).
