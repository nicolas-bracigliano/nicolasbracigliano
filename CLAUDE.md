# Working in this repo

This repository is public. Keep plans, private runbooks, account details, and audit reports outside it. Review the staged diff for sensitive material before committing.

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
- **When renaming, moving, or rewiring behaviour, search for comments naming the old file, symbol, or behaviour.** Update cross-references with the implementation.

## Gotchas (hit these, save the next session the cycles)

- **Editing `src/lib/remark-inject-margin-notes.ts` needs a cache clear.** Astro caches markdown processing in `node_modules/.astro` + `.astro`; plugin edits won't show in `pnpm dev` or `pnpm build` until you `rm -rf node_modules/.astro .astro` first.
- **gitleaks flags fields whose names contain `key`/`secret`/`token`.** If a non-secret stable identifier needs a frontmatter field or a code symbol, prefer `Id`/`Identifier`/`Ref`. The `generic-api-key` rule matches the substring paired with entropic values (kebab-slug + date clears the threshold), and renaming the field is more robust than allowlisting the rule.
- **The post-deploy CI smoke retries 4xx on purpose.** Cloudflare Workers Static Assets has a brief propagation window where a just-deployed URL 404s while siblings serve. `fetch()` (and `curl --retry`) don't retry 4xx, so `scripts/smoke-routes.ts` rolls its own loop. Don't "simplify" it away.
- **Run lockfile-mutating pnpm commands through `corepack pnpm@<pinned>`.** Use the version in `package.json` to avoid unrelated package-manager changes and inconsistent dependency resolution.
- **`pnpm update` skips transitive deps unless you pass `--depth Infinity`.** Plain `pnpm update <pkg>` only touches direct dependencies, so it's a silent no-op for anything that arrives through the tree — which is most of what `pnpm audit` flags. Prefer this over adding a `pnpm-workspace.yaml` override when the patched version is already inside the parent's range; the override block is for the cases with no in-range fix, and every entry there has to be revisited later.
- **Nothing younger than 3 days installs.** `pnpm-workspace.yaml` sets `minimumReleaseAge: 4320`. Range resolution quietly picks the newest version old enough, so `pnpm update` can land below "latest" on purpose. An exact pin that's too young fails (`within the minimumReleaseAge cutoff`), and `--frozen-lockfile` in CI rejects any lockfile entry younger than the floor, so a lockfile resolved without the floor (an older pnpm, or `minimumReleaseAge` overridden) breaks CI. For a fix that can't wait, add the exact `name@version` to `minimumReleaseAgeExclude` and remove it once it ages out.
