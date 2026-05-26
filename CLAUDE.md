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
- Margin-note `section:` values must match a real H2 slug or the pull quote silently doesn't render. This is the one piece-level rule with a test (`tests/unit/piece-margin-note-anchors.test.ts`) — it's a correctness bug, not a style call. Everything else editorial is the §7b reflection guide, not a test.

## Gotchas (hit these, save the next session the cycles)

- **Editing `src/lib/remark-inject-margin-notes.ts` needs a cache clear.** Astro caches markdown processing in `node_modules/.astro` + `.astro`; plugin edits won't show in `pnpm dev` or `pnpm build` until you `rm -rf node_modules/.astro .astro` first.
- **gitleaks flags slug-like example strings.** An example `translationKey` of the form `word-word-YYYY-MM-DD` in docs trips the `generic-api-key` rule (high entropy + dated pattern) and blocks the commit. Keep example slugs low-entropy and date-free (`your-piece-slug`). (This very bullet tripped it the first time — meta, but real.)
- **The post-deploy CI smoke retries 4xx on purpose.** Cloudflare Workers Static Assets has a brief propagation window where a just-deployed URL 404s while siblings serve. `curl --retry` doesn't retry 4xx, so the smoke step uses an explicit bash retry loop. Don't "simplify" it back to `--retry`.
