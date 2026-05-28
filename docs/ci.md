# CI / deploy reference

The full workflow lives at `.github/workflows/ci.yml`. This doc is
the "what's it for, what runs when, what's required" plain-English
companion. Cross-reference, not duplicate — when the YAML changes,
update both.

---

## Job map

```
                  ┌─────────────────────────┐
                  │ changes                 │  ← Detect changed paths
                  │ (paths-filter)          │     for short-circuiting
                  └────────────┬────────────┘
                               │
                  ┌────────────┴────────────┐
                  │ build                   │  ← typecheck / lint /
                  │                         │     vitest / astro build /
                  │                         │     html-validate / pagefind
                  └────────────┬────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────┴──────┐    ┌──────────┴────────┐    ┌────────┴────────┐
│ lighthouse   │    │ e2e               │    │ deploy-check    │  ← are
│ (skips on    │    │ (Playwright;      │    │ (secrets        │     CF
│  docs-only)  │    │  skips on docs)   │    │  present?)      │     creds
└───────┬──────┘    └──────────┬────────┘    └────────┬────────┘     set?
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                  ┌────────────┴────────────┐
                  │ deploy                  │  ← wrangler deploy
                  │                         │     (or versions upload
                  │                         │      --preview-alias)
                  │                         │     + smoke tests
                  │                         │     + sticky PR comment
                  └─────────────────────────┘
```

## Triggers

The workflow fires on:

- **Push to `main`**: runs every job; `deploy` lands on production
  (the canonical `<worker>.<account>.workers.dev` URL plus the
  custom domain `nicolasbracigliano.com`).
- **Pull request (any base)**: runs every job; `deploy` uploads a
  preview version with the shared alias `preview`, accessible at
  `preview-<worker>.<account>.workers.dev`. The most recent push
  to any open PR wins — single shared preview URL across PRs.
- **`workflow_dispatch`**: manual trigger via `gh workflow run
ci.yml --ref <branch>` or the Actions tab. Useful for re-running
  after a Cloudflare-side change (token rotation, project rename)
  without forcing a no-op commit.

## What "skips on docs-only" means

The `changes` job uses
[`dorny/paths-filter`](https://github.com/dorny/paths-filter) to
inspect which paths the push/PR touches. If only documentation /
issue-template / similar paths change, `lighthouse` and `e2e`
short-circuit with `if: needs.changes.outputs.code == 'true'`.
The `build` job still runs (catches an Astro/TS regression in a
doc-adjacent file). `deploy` still runs (docs PRs need previews
too).

Paths that DO trigger the heavy jobs (the "code" filter group):

- `src/**`, `public/**`, `tests/**`, `scripts/**`, `functions/**`
- `astro.config.*`, `wrangler.toml`, `lighthouserc.json`
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `tsconfig.json`, `playwright.config.ts`
- `.github/workflows/**` (changes to CI itself force a full run)

Override: set repo Variable `LHCI_FORCE=true` or `E2E_FORCE=true`
to force the corresponding job to run even on docs-only changes.

**Override is repo-wide, not per-PR.** Flipping `LHCI_FORCE=true`
forces `lighthouse` on for every PR until you flip it back —
there's no per-PR or per-branch override. If you need to force
the checks for a single PR specifically, the right move is to
push a tiny change that's in the `code` filter group (e.g.,
touch `src/lib/routes.ts` with a trivial comment edit) rather
than flipping the global variable. For per-run manual reruns,
`gh workflow run ci.yml --ref <branch>` re-triggers the same
filter logic — it doesn't bypass it.

## Status checks — required vs informational

When **branch protection** lands on `main` (Phase-0 Step 8 in
`docs/phase-0-infrastructure.md` — available since the repo went
public on 2026-05-25), these are the checks to mark as
**required**:

| Check name                     | Required | Why                                                                                                                                                                                    |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Build & Verify`               | yes      | Typecheck + lint + tests + build must pass before merging                                                                                                                              |
| `Lighthouse CI`                | yes      | Performance + a11y + best-practices + SEO scores ≥ 0.95                                                                                                                                |
| `E2E tests (Playwright)`       | yes      | A11y / behaviour regression net                                                                                                                                                        |
| `Detect changed paths`         | no       | Infrastructure helper, not a quality gate                                                                                                                                              |
| `Check deploy prerequisites`   | no       | Reports whether secrets exist; not a regression signal                                                                                                                                 |
| `Deploy to Cloudflare Workers` | no       | Often legitimately skipped (no secrets, docs-only with skips). When it fails for a Cloudflare-side reason, the PR should still merge — production deploy will pick up on the next push |

Don't mark `Deploy to Cloudflare Workers` as required. CF outages
or token rotations would block merges otherwise, and the deploy
fires again on the next push anyway.

## Local parity

`pnpm verify` runs the same suite of checks as the `build` +
`lighthouse` + `e2e` CI jobs combined: typecheck → lint →
prettier → vitest → astro build → html-validate → playwright →
lhci. It's split into two sub-scripts so you can run the fast
half during development:

```sh
pnpm verify:fast   # typecheck + lint + prettier + vitest (~5s)
pnpm verify:slow   # build + html-validate + playwright + lhci (~80s)
pnpm verify        # both, in order
```

Note that `pnpm verify` runs sequentially while CI runs
`lighthouse` and `e2e` in parallel after `build`. So the local
suite takes longer in wall-clock time than CI does — but it's
exhaustive: if `pnpm verify` is green, every CI quality check
will pass.

The deploy step is the only thing local can't simulate (no
Cloudflare credentials in the dev shell, and we don't want
them).

## Deploy specifics

Detail lives in `docs/phase-0-infrastructure.md` (Steps 1 and 5)
and in the inline comments above each step in
`.github/workflows/ci.yml`. The essential summary:

- `wrangler.toml` is the single source of truth for deploy target
  (`name`, `compatibility_date`, `[assets] directory`).
- Production deploy = `wrangler deploy`; preview = `wrangler
versions upload --preview-alias=preview`. Both emit a
  `deployment-url` step output that `environment.url` picks up
  and that the smoke-test job verifies.
- Three smoke checks run after every successful deploy:
  - **Routes**: every path in `src/lib/routes.ts` plus every
    published entry under `src/content/{notes,pieces,works}/` is
    hit with `fetch`, status codes checked (302 for `/`, 200 for
    everything else; 404 for a deliberately bogus path). The
    route list is derived at runtime by `scripts/smoke-routes.ts`
    so it tracks `routes.ts` and content additions without a
    parallel hardcoded list. Retry-on-4xx (six attempts × 3 s)
    handles the post-deploy asset-propagation window per the
    CLAUDE.md gotcha.
  - **Body content**: `/en/` response must contain `<title>` and
    the wordmark string `Bracigliano`. Catches an Astro build
    that silently emitted empty pages.
  - **Security headers** (presence-only, not value-level): every
    header declared in `public/_headers` must appear in the
    response for `/en/`, plus `server: cloudflare` must be
    present. **Limitation**: this checks the header NAME, not
    its value — a CSP set to `default-src 'unsafe-inline'`
    would pass. The value-level audit lives at
    [securityheaders.com](https://securityheaders.com/) and
    should be re-run by hand after any change to `_headers`
    or after a Cloudflare-side config change. For known
    regressions: catches `_headers` failing to be copied by
    Astro, a Cloudflare override stripping a header, or a
    parse error breaking one of the entries.
- Sticky comment on every PR with the preview URL — one comment,
  updated in place rather than accumulating.

## Adding a new check

If a new quality gate becomes load-bearing (e.g., a future
visual-regression suite), add it as a new job that `needs: build`
and produces a clear pass/fail. Mark it required in branch
protection once it's stable.

If the new check is fast (<30 s) and you want it on docs-only
PRs too, omit the `changes` dependency. If it's slow, add it to
the `code` filter group above and gate the new job the same way
as `lighthouse` / `e2e`.
