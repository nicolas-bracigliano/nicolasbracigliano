# 0012 — Pieces is an editorial article, not a marginalia notebook

**Status**: Accepted
**Date**: 2026-05-26

## Context

Pieces (`/en/pieces/` · `/es/ensayos/`) shipped in PR P3 with the same visual treatment as `/notes`: a 3-column grid (date + tags rail · prose body · margin-note rail), with `<MarginNote>` instances floated into the right gutter from their anchor headings. The 4 P3 pieces — Rings, CPR, C4, Agile — all use this layout. Notes had been the design system's reference treatment since §3 was written; pieces were "the same notebook treatment, longer."

The editorial review pass that followed P3 surfaced a tension. The notebook treatment fits short-form writing — a note is a field-log entry, scribbled in mono, dated, in process. A piece is something else: an argued position, polished, slow. Reading a 1200–1500-word argument in mono with a marginalia rail reads as "long note," not as "essay." The face is the message, but the layout has to earn it.

A prototype CSS file (`Prototype/styles-pieces.css`, prototype screenshots) was drafted to test what the editorial register would look like: single column, 760px centered, display H1 (clamp 46–88px), italic large lede, drop cap on the first paragraph, italic H2 with a floated `§` marker, inline pull quotes where the margin notes lived, dashed-border foot with an italic signature, redesigned index row-list with hover-slide. The prototype reads as an editorial article. The current state reads as a long-form note. They are different documents.

## Decision

`/pieces` is an editorial article, not a marginalia notebook. The visual metaphor in design-system §3 changes accordingly:

| Route                  | Treatment (was)             | Treatment (now)                                                                         |
| ---------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `/pieces` · `/ensayos` | Marginalia notebook, longer | Editorial article — centered single column, display title, drop cap, inline pull quotes |

Concrete commitments:

1. **Layout** — single column, `max-width: 760px`, centered. The 3-column `.piece` grid is removed. The `.piece-left` rail (date + tags column) is removed. The right-rail margin-note gutter is removed.
2. **Body measure** — `max-width: 62ch` on `.piece-prose`. 18 px / 1.65 serif (foundation from the prior P5 scope stays).
3. **Display H1** — `clamp(46 px, 6.2vw, 88px)` serif. The piece's frontmatter `title:` may contain inline `_italic_` markdown for split-style display (e.g. "The case for the _small static site_"); the layout interprets it via a narrow inline replacer, not a full markdown processor.
4. **Italic large lede** — `clamp(20 px, 2.2vw, 24px)` italic serif, `max-width: 56ch`.
5. **Eyebrow + meta line** — mono eyebrow above the title with back-link, collection label, read-time (`← back to pieces · ESSAY · 18 MIN` / `← volver a ensayos · ENSAYO · 18 MIN`). Mono meta line below the title with date and an optional "written in PLACE, in SEASON" suffix from a new optional `written:` frontmatter field.
6. **Drop cap** — first paragraph of body only, `4.5em`, `var(--accent)` color. Targeted via a `.lead-p` class injected by the remark plugin (not `:first-of-type`, which is fragile against future plugins).
7. **Italic H2 with `§` marker** — `clamp(26 px, 2.6vw, 32px)` italic serif. `::before { content: "§" }` floated at `left: -1.4em`, accent-colored, upright. Mobile collapses the marker to above the heading.
8. **Inline pull quotes** — `<MarginNote>` is repurposed to render `<aside class="pull">`. The remark plugin's anchor logic changes from "after the matching H2" to "after the last paragraph of the matching section, before the next H2." The frontmatter API stays (`marginNotes: [{ section, text }]`); the rail-anchored aside becomes an inline pull quote with italic serif and an accent left-border.
9. **Foot redesign** — `max-width: 62ch`, dashed top border, mono meta strip (read-time + date, **no tags**), italic serif signature, mono nav row. Tags render only on the index.
10. **Index redesign** — row-list (`.pieces-list > .piece-row`) with a 180px mono meta column, serif title, italic deck, mono tags strip, trailing arrow. Hover slides the row right 18 px with a tinted background. Mobile (≤720 px) collapses to a single column.
11. **Optical sizing + hanging punctuation + hyphenation** — `font-optical-sizing: auto` on every serif surface; `hyphens: auto` and `hanging-punctuation: first` on body paragraphs.
12. **Non-goal** — a third face. Newsreader does double duty (18 px reads, 80 px shouts). Future additions need a separate ADR.

## Alternatives considered

| Option                                                                                           | Why not                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the rail, scale up the rest of the typography around it                                     | The rail is what made it read as marginalia. Display titles and drop caps on top of a rail layout fight each other; the eye doesn't know whether it's reading marginalia or an article. Either commit to one register or the other. |
| Rename `/pieces` → `/essays` at the markup level (use `.essay-body` from the prototype verbatim) | ADR 0010 was explicit about the EN slug staying as `pieces` for the same reasons the route was created. Class names follow the route, not the prototype's filename. Keep `.piece-*`; adapt the prototype's CSS.                     |
| Defer the index redesign to a later PR (P7)                                                      | The index is the entry point to the editorial article. Shipping a redesigned slug-page behind a card-style index reads as half-finished. Index goes in this PR; reading-mode and code-block treatments are the genuine follow-ups.  |
| Keep margin notes as right-rail asides, add pull quotes as a separate element                    | Two ways of saying "this is an aside" in one document is one too many. The pull-quote treatment carries the aside semantic strongly enough that the rail loses its job.                                                             |

## Consequences

**Throwing away.** The 3-column grid CSS, the `.piece-left` rail markup, the floated-right `.margin-note--inline` CSS, the previous P5 "margin notes stay serif because rail position carries the aside-ness" decision (the rail is gone; the decision is moot).

**Migration cost.** The 4 P3 pieces × 2 locales = 8 markdown files gain an optional `written:` frontmatter field. The 3 `<MarginNote>` instances per piece × 8 files have their text reviewed for pull-quote suitability — most aphoristic margin notes work as pull quotes; annotation-style notes are reworded or dropped during this PR. The visual-snapshot baseline for `piece-body-desktop.png` is regenerated; a new `piece-pull-quote.png` baseline is added.

**Open follow-ups (separate PRs).**

- **PR P6** — code-block treatment: two-gray syntax highlighting, language label, captions, diff styling without red/green. No piece currently uses block code.
- **PR P7** — reading mode (`html[data-reading="true"]`) that fades the chrome scroll-thread + foot-rail when the reader is mid-piece.

**Updated documents.**

- `docs/design-system.md` §3 — `/pieces` row revised from "marginalia notebook" to "editorial article."
- `docs/design-system.md` §9 — pull-quote rule, drop-cap rule, `font-optical-sizing` note added; the two-face mapping table from the prior P5 foundation stays.
- `docs/design-system.md` §17 — "Real pieces" item under Shipped updated to reference the editorial layout and this ADR.

## References

- Prototype CSS — committed alongside this ADR at [`0012-prototype-styles.css`](./0012-prototype-styles.css). The shipped `src/styles/routes/pieces.css` adapts this spec to the project's `.piece-*` class convention (ADR 0010 keeps the EN slug as `pieces`, not `essays`); the prototype's class names (`.essay-body`, `.essays-list`) map to `.piece-prose`, `.pieces-list > .piece-row`.
- ADR 0010 — asymmetric bilingual route naming.
