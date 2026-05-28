# 0013 — Per-entry art via `hero:`, per-kind defaults from a registry

**Status**: Accepted
**Date**: 2026-05-28

## Context

Before this ADR, decorative art was per-kind, not per-entry:

- `src/components/WorkArt.astro` held a giant switch over a closed `art:` enum (eight inline-SVG variants). Adding a new variant meant editing the schema enum, the variant union, the JSX branch, and sometimes CSS — three to five files for one visual.
- `src/components/NoteGlyph.astro` did the same for a 5-value `glyph:` enum on notes.
- `src/components/BenchCard.astro` reinvented the pattern a third time with four inline SVG vignettes keyed on bench `kind`.

Three independent switches, all keyed on what amounts to the same site-wide taxonomy (now consolidated as `ContentKind` per PR #88). The friction wasn't theoretical: the colophon's "this site" work shipped with a custom `art: font-specimen` value that existed nowhere else, because per-kind defaults made every code-kind work look the same.

The repo already had the right pattern for this in one place — `DiagramRail.astro` + `src/lib/diagram-registry.ts` + per-diagram components in `src/components/diagrams/`. Adding a diagram = drop one `.astro` file + one registry line. Two named touch points. Scales.

## Decision

Lift the diagram-registry pattern to all decorative art, with one addition: a per-entry override.

**Per-entry override.** The `hero` schema field (declared since launch on notes/pieces/works but never rendered) is now the canonical per-entry visual. Author drops an SVG next to the markdown, sets `hero: ./art.svg`, and the entry renders that — at vignette size for works, at glyph size for notes. No enum to extend.

**Per-kind defaults.** When `hero:` is absent, the renderer dispatches to a per-kind component from a registry inlined in `src/components/ContentArt.astro`:

- `WORK_VIGNETTES: Record<WorkKind, …>` keyed by `code | guitar | garden | print`
- `NOTE_GLYPHS: Record<NoteKind, …>` keyed by `code | guitar | garden | coffee`

Each registry value points at a single-purpose component under `src/components/art/{vignettes,glyphs}/<Kind>.astro`. Adding a new kind's default = drop a component + add one map entry. The schema enum is `WORK_KINDS` / `NOTE_KINDS` from `src/lib/content-kinds.ts` — no per-component duplicate enum.

The registry maps live inside `ContentArt.astro` rather than a separate `art-registry.ts` for an infrastructural reason: the pre-commit hook runs plain `tsc` (for speed), which can't resolve `.astro` imports from a `.ts` file even with path aliases. `astro check` handles them; plain `tsc` doesn't. Keeping the maps inside an `.astro` consumer sidesteps that pitfall and the registry pattern is preserved.

**One dispatcher.** `src/components/ContentArt.astro` accepts an entry, infers surface from `entry.collection`, and renders hero-or-registry-default inside the existing wrapper classes (`.work-art--<kind>` for works, `.note-glyph.g-<kind>` for notes). Call sites (WorkCard, WorkLayout, NoteEntry) get one prop: `entry`.

**The old fields go away.** `art:` is removed from the works schema. `glyph:` is replaced by an optional `kind:` on notes; existing notes have `glyph: X` mechanically renamed to `kind: X`, and the `'none'` sentinel becomes "omit the field entirely."

## What we accept

- **`this-site` loses `font-specimen`.** The colophon work shipped a custom HTML/CSS specimen vignette (big italic `Aa` plus a meta line). Converting that to a self-contained SVG drops the CSS-variable-driven typography that made it match the site fonts. We accept the loss: the colophon now shows the code-default (terminal log), and re-introducing the specimen as a real per-entry hero is a follow-up that proves the new mechanism on a real case.
- **BenchCard stays specialised.** The home-page bench cards bake user-content into the SVG (`guitarLabel`, `seedlingTag` are rendered as `<text>` inside the vignette). The registry's "stateless per-kind component" shape doesn't fit; a `BenchCard kind="guitar"` is already per-instance. Refactoring it would force a leaky props-by-kind abstraction across all the other components. BenchCard keeps its inline SVGs.
- **The `print` and `read` kinds have no note glyph yet.** No existing note uses them; `NOTE_KINDS` excludes them by design. Adding either is a one-line change here plus a new component in `art/glyphs/`.

## Alternatives considered

| Option                                                             | Why not                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the inline switches, just rename the enums                    | Solves nothing. The friction is the per-variant switch + matching CSS, not the enum name.                                                                                                                                                            |
| One mega-registry with `Record<ContentKind, …>`                    | Forces fake entries for kinds that don't apply (no `coffee` work; no `print` glyph) and makes every consumer narrow the value. The split into `WORK_VIGNETTES` and `NOTE_GLYPHS` lets each registry stay tight to its surface.                       |
| Migrate every work to directory shape (`<slug>/index.md`) up front | Only `this-site` had custom art; one entry is not a directory-restructure motivator. Keep the flat shape; let entries opt into directories when they want a hero. Astro's content loader handles both shapes via the same `pattern: '**/*.md'` glob. |
| Drop `hero:` entirely and only ship per-kind defaults              | Solves the variant-switch friction but doesn't solve "every code work looks the same." Per-entry expression was the point.                                                                                                                           |

## Consequences

- **Adding a new visual identity is now two touch points**: drop an SVG file, set `hero:`. No enum, no component edit, no CSS rule.
- **Adding a new default for a new kind is two files**: a component + a registry line.
- **The wrapper CSS classes are unchanged.** Route stylesheets and tests that select `.work-art--<kind>` / `.note-glyph.g-<kind> svg` keep working.
- **No `art:` / `glyph:` enum drift surface.** The schema is one rank smaller in both collections.
- **Migration cost was localised.** Six notes (`glyph: X` → `kind: X`) + two works (`art: font-specimen` dropped) + four consumer files updated + two component files deleted. No content reshape required.

References: [ADR 0010](./0010-asymmetric-bilingual-route-naming.md) (parallel pattern for diagrams), [ADR 0011](./0011-long-form-piece-shape.md) (precedent for "content owns its expression").
