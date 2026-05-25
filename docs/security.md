# Security notes

> **Current state vs. target state.** Several sections below describe the
> target configuration (DNSSEC, server-side analytics, commit signing,
> branch protection). Some are not live yet — they're pending account
> setup or pending branch-protection rule configuration on `main` (now
> available since the repo went public on 2026-05-25; see ADR 0004
> postscript for the Renovate revisit that depends on it).
> Recipes below are how to wire each one up when you get there.

## Commit signing

**Status**: local hook only. Server-side enforcement pending GitHub
branch protection rule configuration on `main` (available since the
repo went public on 2026-05-25).

SSH commit signing is intended to be enforced server-side via branch
protection on `main`. Until that lands, the `pre-push` hook in
`lefthook.yml` is the only enforcement — it refuses to push unsigned
commits as a fast feedback loop, but only fires on this developer's
machine.

Setup:

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

Then add the **public** half of the SSH key to GitHub Settings → SSH and GPG
keys → **Signing keys** (separate section from authentication keys).

Edits via the GitHub web UI or mobile won't be signed. Treat them as forbidden
on `main` — the branch protection rule rejects them.

## DNSSEC

**Status**: pending Cloudflare zone setup (the Worker exists; the DNS
zone for `nicolasbracigliano.com` is what activates DNSSEC).

Once the zone is active, enable DNSSEC for `nicolasbracigliano.com`
in the Cloudflare DNS dashboard. Cloudflare will produce a DS record
(KSK). Copy that DS record to the registrar for the apex domain. The
chain of trust is live once the registrar publishes the DS at the TLD
level (usually within an hour).

Verify with:

```bash
dig +dnssec nicolasbracigliano.com
```

You should see `RRSIG` records alongside the answer set.

## Vulnerability disclosure

Use the alias `security@nicolasbracigliano.com` (forward to primary inbox).
RFC 9116 expects a long-lived contact; an alias is easier to retire/rotate
than the primary address. The CI `security-txt-expires` job fails the build
if `Expires` is < 30 days away.

## Analytics

**Status**: configuration target; not enabled yet (pending Cloudflare
zone setup).

Cloudflare Web Analytics will be enabled in **server-side mode** for the
zone. Aggregates pageview / referrer / country stats from edge logs at
the proxy — no JS, no cookies, no CSP loosening, no PII. This is the
mode (not the default client-side beacon).

## Draft preview

`getStaticPaths` filters on `status: 'published'`, so drafts are invisible
locally too. To preview a draft, flip `status: published` in a working copy,
do not commit, run `pnpm dev`.

## Token rotation

- **Cloudflare API token** — scoped to Pages on `nicolas-bracigliano` only. Rotate annually
  or on staff change. Rotate immediately on suspected leak.
- **GitHub Actions tokens** — workflows use `permissions: {}` at the top and
  only request the minimum scope per job. Audit on each PR that touches `.github/workflows/`.

## Automation

Four scheduled / event-driven workflows run independently of the main
`ci.yml` pipeline. None require human babysitting:

- **`.github/workflows/security.yml`** — daily at 22:00 UTC. Runs
  `pnpm audit --prod --audit-level=high` (fails on HIGH+), uploads the full
  `pnpm audit --json` as an artifact for moderate-severity triage, runs the
  license allow-list (`license-checker` + `MIT;ISC;Apache-2.0;BSD-2;BSD-3;CC0;0BSD;Unlicense`),
  gitleaks secret scan, CodeQL static analysis (TS/JS) via
  `.github/codeql/codeql-config.yml`, and the `security-txt-expires` guard
  that fails if `Expires` is < 30 days from lapsing.
- **`.github/workflows/security-txt-rotate.yml`** — monthly on the 1st at
  22:00 UTC. Checks `security.txt` Expires; if < 60 days away, opens a
  PR (via `peter-evans/create-pull-request`) bumping Expires to today + 1 year.
  The rotation PR triggers the normal CI gates plus the `security-txt-expires`
  guard for verification before merge. Prevents the Expires field becoming
  a once-a-year manual chore.
- **`.github/workflows/release-please.yml`** — runs on every push to `main`.
  Opens or updates a "release PR" that maintains `CHANGELOG.md` and bumps
  `package.json` version based on Conventional Commit prefixes (feat → minor,
  fix → patch, while pre-1.0 per `release-please-config.json`). Merging
  that PR cuts a GitHub Release with a tag.
- **Renovate** (managed externally by the Mend Renovate GitHub App; config in
  `renovate.json`) — runs Mondays 04:00 Australia/Melbourne. Automerges
  patch/minor/digest/lockfile/vulnerability updates after CI gates pass;
  majors gated for human review. Vulnerability alerts have a separate
  immediate schedule. See [`docs/decisions/0004-renovate-internal-automerge.md`](./decisions/0004-renovate-internal-automerge.md).

Action versions across all workflows are pinned to 40-char SHAs with the
tag in a trailing comment; Renovate's `helpers:pinGitHubActionDigests`
preset maintains them. The `permissions: {}` at workflow root + minimal
per-job grants keeps the GITHUB_TOKEN scope tight.

## Notes on `lockfile-lint`

Considered and removed. `lockfile-lint@5` doesn't parse `pnpm-lock.yaml`
(YAML format, not the JSON it expects). The integrity intent — making
sure every dep resolves through the npm registry over HTTPS with valid
checksums — is partly covered by `audit-signatures=true` in `.npmrc`
plus `pnpm audit --audit-level=high` in `security.yml`. The thing not
covered: a typo'd registry URL in a transitive dep's manifest pointing
at a malicious mirror. Low likelihood for our deps; flagged here as a
known gap. Replace with a pnpm-aware tool if/when one becomes mature.

## Host-neutral header directives

The `public/_headers` file uses Cloudflare/Netlify syntax. If you ever move the
site, this table is the host-neutral source of truth for what each directive
needs to look like on the new host. Update both columns in lock-step.

| Logical directive              | Cloudflare/Netlify `_headers`                                                                         | Vercel `vercel.json` `headers`                                           | nginx                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Strict CSP (script-src strict) | `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; …` | `{ "key": "Content-Security-Policy", "value": "default-src 'self'; …" }` | `add_header Content-Security-Policy "default-src 'self'; …" always;`                              |
| HSTS preload                   | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`                             | same value, JSON object                                                  | `add_header Strict-Transport-Security "…" always;`                                                |
| MIME sniffing off              | `X-Content-Type-Options: nosniff`                                                                     | same                                                                     | `add_header X-Content-Type-Options nosniff always;`                                               |
| Referrer policy                | `Referrer-Policy: strict-origin-when-cross-origin`                                                    | same                                                                     | `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`                            |
| Permissions policy             | `Permissions-Policy: accelerometer=(), camera=(), …`                                                  | same                                                                     | `add_header Permissions-Policy "…" always;`                                                       |
| Cross-origin opener            | `Cross-Origin-Opener-Policy: same-origin`                                                             | same                                                                     | `add_header Cross-Origin-Opener-Policy same-origin always;`                                       |
| Cross-origin resource          | `Cross-Origin-Resource-Policy: same-origin`                                                           | same                                                                     | `add_header Cross-Origin-Resource-Policy same-origin always;`                                     |
| Frame deny                     | `X-Frame-Options: DENY`                                                                               | same                                                                     | `add_header X-Frame-Options DENY always;`                                                         |
| Immutable Pagefind             | `/_pagefind/* … Cache-Control: public, max-age=31536000, immutable`                                   | per-route entry with `source: "/_pagefind/(.*)"`                         | `location /_pagefind/ { add_header Cache-Control "public, max-age=31536000, immutable" always; }` |
| Immutable fonts                | `/fonts/* … Cache-Control: public, max-age=31536000, immutable`                                       | `source: "/fonts/(.*)"`                                                  | same shape                                                                                        |

### CSP delivery — \_headers only

CSP is delivered **exclusively** by `public/_headers` at the edge. We do
not emit `<meta http-equiv="content-security-policy">` because Astro 6's
`<ClientRouter />` (used for native View Transitions) injects per-build
view-transition styles at runtime, and Astro's build-time CSP hashing
cannot cover them. The CSP spec also says `'unsafe-inline'` is _ignored_
when any hash is present in the same directive — so mixing the two
(Astro's auto-emitted hashes + an `'unsafe-inline'` fallback) doesn't
permit the runtime styles in practice.

### Why `style-src 'unsafe-inline'`

ClientRouter needs to inject inline styles at runtime for View
Transition group naming and animation. The accepted trade-off:

- **`script-src 'self'`** stays strict. This is the real XSS attack
  surface — inline-script CSP weakening is what enables most real-world
  attacks.
- **`style-src 'self' 'unsafe-inline'`** permits the runtime styles.
  CSS injection's attack surface on a static, no-user-input site is
  effectively nil (no auth to phish, no data to exfiltrate via CSS
  selectors, `img-src 'self'` already blocks the `background-image:
url(evil.com)` exfiltration vector).

## Lock-in surface and escape plan

Cloudflare (originally Pages, now Workers Static Assets after PR #49 — see [ADR 0001 postscript](./decisions/0001-cloudflare-pages.md)) was chosen because:

- Free tier covers a personal site indefinitely.
- Server-side Web Analytics (zero JS, zero cookies) is unique to Cloudflare.
- DNSSEC + HSTS preload + edge DDoS protection are first-class.
- A small Worker (`src/worker.ts`) handles the `/` Accept-Language
  redirect — no SSR adapter, no framework lock-in for the rest of the site.
- We deploy via `wrangler` from GitHub Actions, not the git integration, so the
  build artefact is auditable.

The lock-in surface is **5 files** (post-PR-#49 — `functions/index.ts` was
replaced by `src/worker.ts` when the deployment migrated to Workers Static
Assets):

| File                       | What's Cloudflare-specific                                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/worker.ts`            | Default-export `fetch(request, env)` shape; `env.ASSETS.fetch()` is the Workers Static Assets binding. The redirect logic itself is in `src/lib/pick-locale.ts` as a platform-neutral `EdgeHandler`. |
| `public/_headers`          | Cloudflare/Netlify syntax. See table above.                                                                                                                                                          |
| `public/_redirects`        | Same syntax family.                                                                                                                                                                                  |
| `wrangler.toml`            | Cloudflare CLI config (`[assets]` binding + `run_worker_first`).                                                                                                                                     |
| `.github/workflows/ci.yml` | Uses `cloudflare/wrangler-action` in the deploy job.                                                                                                                                                 |

### Escape plan (half a day's work to port to another static host)

1. **Delete** `src/worker.ts`, `public/_headers`, `public/_redirects`,
   `wrangler.toml`.
2. **Rewrite the redirect** against the new platform's edge runtime. Import
   `acceptLanguageRedirect` from `src/lib/pick-locale.ts` and write the
   platform's small adapter (Vercel Edge, Netlify Edge, Deno Deploy, Bun
   — all speak `Request`/`Response`). If the new host has no edge runtime,
   render a `<meta http-equiv="refresh">` shim at `/` or default to `/en/`.
3. **Translate headers** to the new host's syntax using the table above.
4. **Swap the deploy workflow** to the host's GitHub Action (e.g.
   `actions/deploy-pages` for GitHub Pages, `amondnet/vercel-action` for
   Vercel).

### When to revisit the choice

- You add SSR (`output: 'server'` or `'hybrid'`) — at that point the Astro
  adapter binds you to one host. Hold the line on `output: 'static'`.
- Cloudflare reprices the Workers free tier — the redirect falls back to a
  static shim cheaply.
- The site needs CDN-level personalisation (cookies, A/B) — that's when
  Cloudflare's lock-in starts being load-bearing instead of cosmetic.
