# nicolasbracigliano.com

Nicolas's digital home.

## Stack

- **Framework** — Astro 6 (static output, no SSR adapter)
- **Runtime** — Node 24 LTS, pnpm via Corepack
- **Content** — Markdown in repo, typed via Zod content collections
- **Hosting** — Cloudflare Pages + one Pages Function for the `/` Accept-Language redirect
- **Type** — Newsreader (variable, display) · JetBrains Mono (variable, body/mono)
- **CI** — GitHub Actions, SHA-pinned (Renovate manages)

## Docs

- [`docs/design-system.md`](./docs/design-system.md) — **canonical** design system. Read before changing color, copy, layout, or adding a route.
- [`docs/architecture.md`](./docs/architecture.md) — layer map + dependency rule + where to put new code.
- [`docs/security.md`](./docs/security.md) — commit signing, DNSSEC, host-neutral header directives, automation workflows, Cloudflare lock-in surface + escape plan.
- [`docs/decisions/`](./docs/decisions/) — Architecture Decision Records. One file per consequential trade-off. Start here when you need to know _why_ something is the way it is.

## License

- Code: MIT — see [`LICENSE`](./LICENSE).
- Content (markdown, images, OG cards): CC BY-NC-SA 4.0 — see [`CONTENT-LICENSE`](./CONTENT-LICENSE).

## Local dev

```bash
nvm use 24
corepack enable
pnpm install
pnpm dev               # astro dev on :4321
pnpm dev:fn            # build + wrangler pages dev (exercises the / redirect)
pnpm test              # vitest
pnpm test:e2e          # playwright
pnpm typecheck
pnpm lint
pnpm build
```

## Drafts

`getStaticPaths` filters on `status: 'published'` so drafts are invisible
locally too. To preview a draft, flip `status: published` in a working copy,
do not commit, run `pnpm dev`.

## Fonts (one-shot dev task)

```bash
pnpm run subset-fonts   # downloads + writes public/fonts/*.woff2 + og-newsreader.ttf
```

Run once locally, commit the resulting files. CI does **not** subset fonts.

## What runs automatically

- **CI** (`.github/workflows/ci.yml`) — every push + PR: build (typecheck, lint, format, unit tests, astro build, html-validate, pagefind sanity) · Lighthouse CI · Playwright E2E · Cloudflare deploy gated on all of the above + secrets being configured.
- **Security** (`.github/workflows/security.yml`) — daily 22:00 UTC: `pnpm audit`, license allow-list, gitleaks, CodeQL, `security.txt` Expires guard.
- **security.txt rotation** (`.github/workflows/security-txt-rotate.yml`) — monthly on the 1st: opens a renewal PR when Expires is < 60 days from lapsing.
- **release-please** (`.github/workflows/release-please.yml`) — every push to `main`: opens / updates a release PR maintaining `CHANGELOG.md` and bumping `package.json`. Merge cuts a GitHub Release.
- **Renovate** (managed by the Mend GitHub App; config in `renovate.json`) — Mondays 04:00 Australia/Melbourne: automerges safe updates (patch/minor/digest/lockfile/vulnerability) after CI passes; majors gated for human review. Vulnerability alerts have a separate immediate schedule.

See [`docs/security.md § Automation`](./docs/security.md#automation) for details.

## Deferred / next steps

The bootstrap is a working baseline. These items require account access or external setup and are still open:

- **SSH commit signing** — `git config --global gpg.format ssh && git config --global commit.gpgsign true` plus the SSH key in GitHub Settings → SSH and GPG keys → **Signing keys**.
- **Branch protection on `main`** — requires GitHub Pro for private repos. Once enabled: signed commits required, linear history, force-push disabled, all CI status checks required.
- **Cloudflare Pages project** — create the `nicolas-bracigliano` project, add `nicolasbracigliano.com` + `www` custom domains.
- **DNSSEC** — enable for the zone; copy the DS record to the registrar (recipe in [`docs/security.md`](./docs/security.md#dnssec)).
- **Cloudflare Web Analytics** — enable in **server-side** mode for the zone (not the default client-side beacon).
- **GitHub secrets** — `CLOUDFLARE_API_TOKEN` (scoped to Pages on `nicolas-bracigliano`) + `CLOUDFLARE_ACCOUNT_ID`. CI's deploy job stays in a clean "skipping" state until both are set; the moment they appear it activates with no workflow edit.
- **CSP report-only rollout** — ship `Content-Security-Policy-Report-Only` for the first week post-launch, flip to enforce once devtools shows no violations across both languages.
