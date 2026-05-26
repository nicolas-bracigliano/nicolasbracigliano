# Working in this repo

`docs/design-system.md` is the authoritative reference for voice, layout, colour, and content rules. Read the relevant section before changing copy, layout, or adding a route.

## Writing or reviewing content

When you write or review a **piece** (`/pieces` · `/ensayos`) or a **note** (`/notes` · `/notas`), treat the design system as a guide to consult and reflect against — not a spec to satisfy mechanically:

- **Pieces** — follow the recipe in §7a, then run the reflection pass in **§7b** before considering a draft done. §7b is the checklist for both the human writer and you: walk it, flag what you notice, and explain your reasoning. Don't silently "fix" editorial calls — surface them and let the writer decide.
- **Notes** — follow §7.
- **Voice** — §6 governs both (banned phrases, anecdote fidelity, hedges, the five-word test, no em dashes in prose).
- **Bilingual** — ES is a parallel composition, not a translation (rioplatense). §6 + §7a step 6.

These rules are reflective, not enforced by CI. The judgement stays with the writer; the guide informs it. If you're tempted to add a unit test that gates content on a style rule, don't — that conversation happened (ADR 0011) and the answer was a checklist, not a pipeline.

## Conventions worth knowing

- ADRs live in `docs/decisions/`. Read 0011 (piece shape) and 0012 (editorial layout) before touching `/pieces`.
- Per-route CSS in `src/styles/routes/`; component-scoped CSS (diagrams) in `src/styles/diagrams.css`.
- `pnpm verify:fast` (typecheck, lint, format, unit) before committing; `pnpm verify:slow` (build, lhci, e2e, html-validate) for anything visual.
- Margin-note `section:` values must match a real H2 slug or the pull quote silently doesn't render — the most error-prone item on the §7b checklist.
