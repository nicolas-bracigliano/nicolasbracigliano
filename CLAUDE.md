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
- **When renaming, moving, or rewiring behaviour, grep the codebase for comments naming the old file/symbol/behaviour.** Comments here are dense and cross-referential by design; the main rot vector (found in the 2026-06 comment-hygiene sweep, PR #133) is a comment in file A describing behaviour that lives in file B. The code change lands, the pointer in A quietly goes stale.

## Gotchas (hit these, save the next session the cycles)

- **Editing `src/lib/remark-inject-margin-notes.ts` needs a cache clear.** Astro caches markdown processing in `node_modules/.astro` + `.astro`; plugin edits won't show in `pnpm dev` or `pnpm build` until you `rm -rf node_modules/.astro .astro` first.
- **gitleaks flags fields whose names contain `key`/`secret`/`token`.** If a non-secret stable identifier needs a frontmatter field or a code symbol, prefer `Id`/`Identifier`/`Ref`. The `generic-api-key` rule matches the substring paired with entropic values (kebab-slug + date clears the threshold), and renaming the field is more robust than allowlisting the rule.
- **The post-deploy CI smoke retries 4xx on purpose.** Cloudflare Workers Static Assets has a brief propagation window where a just-deployed URL 404s while siblings serve. `fetch()` (and `curl --retry`) don't retry 4xx, so `scripts/smoke-routes.ts` rolls its own loop. Don't "simplify" it away.
- **Run lockfile-mutating pnpm commands through `corepack pnpm@<pinned>`, not bare `pnpm`.** `package.json` pins `packageManager`, and CI honours it via `pnpm/action-setup` — but a locally installed pnpm (nvm, Homebrew) resolves ahead of the corepack shim, so bare `pnpm` here is whatever version you happen to have. It fails in two ways that both look like success: it rewrites `packageManager` to its own version plus a `+sha512…` hash as an unrelated diff hunk, and it resolves differently. Found in the 2026-08 audit sweep (PR #226): `pnpm update --depth Infinity postcss nanoid` under the wrong version left 8.5.22 and 8.5.26 side by side in the lockfile with the advisory unfixed; the identical command under `corepack pnpm@11.8.0` resolved to a single 8.5.26. Read-only commands (`pnpm audit`, `pnpm why`) are fine either way.
- **`pnpm update` skips transitive deps unless you pass `--depth Infinity`.** Plain `pnpm update <pkg>` only touches direct dependencies, so it's a silent no-op for anything that arrives through the tree — which is most of what `pnpm audit` flags. Prefer this over adding a `pnpm-workspace.yaml` override when the patched version is already inside the parent's range; the override block is for the cases with no in-range fix, and every entry there has to be revisited later.
