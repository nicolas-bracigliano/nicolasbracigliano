# nicolasbracigliano.com

Nicolas's digital home.

## Stack

- **Framework** — Astro 6 (static output, no SSR adapter)
- **Runtime** — Node 24 LTS, pnpm via Corepack
- **Content** — Markdown in repo, typed via Zod content collections
- **Hosting** — Cloudflare Pages + one Pages Function for the `/` Accept-Language redirect
- **Type** — Newsreader (variable, display) · JetBrains Mono (variable, body/mono)
- **CI** — GitHub Actions, SHA-pinned (Renovate manages)

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

## Deferred / next steps

The bootstrap is intentionally a working baseline. These items require account
access and aren't done yet:

- **SSH commit signing** — `git config gpg.format ssh && git config commit.gpgsign true` (local) plus add the SSH key to GitHub Settings → SSH and GPG keys → Signing keys.
- **Branch protection on `main`** — signed commits required, linear history, force-push disabled, all CI checks required.
- **Cloudflare Pages project** — create `nb-site`, add `nicolasbracigliano.com` + `www` custom domains.
- **DNSSEC** — enable for the zone; copy the DS record to the registrar (see `docs/security.md`).
- **Cloudflare Web Analytics** — enable in server-side mode for the zone.
- **GitHub secrets** — `CLOUDFLARE_API_TOKEN` (scoped to Pages on this project) + `CLOUDFLARE_ACCOUNT_ID`.
- **Renovate** — enable the GitHub App on the repo.
- **OG fonts** — run `pnpm run subset-fonts` once and commit `public/fonts/*`.
- **CSP rollout** — start in report-only for a week, flip to enforce once no violations across both languages.

See `~/.claude/plans/im-working-on-creating-velvet-pearl.md` for the full plan.
