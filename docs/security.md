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

**Status**: zone is live and proxied (verified 2026-06-03 — Cloudflare
authoritative NS, apex on Cloudflare anycast, `server: cloudflare` +
`cf-ray` on every response). Page-level Web Analytics is **not** in use and
**cannot** be adopted without widening the CSP — see the Web Analytics bullet
below. Page-level metrics come from Worker invocation logs instead.

Because the domain is a fully proxied zone, two server-side surfaces are
available with no JS, no cookies, no CSP loosening, no PII:

- **Zone Traffic analytics** (dashboard → zone → Analytics & Logs →
  Traffic) aggregates request / bandwidth / country / status-code stats
  from edge logs. On by default for any proxied zone — already collecting.
- **Web Analytics** (dashboard → Web Analytics) adds page-level
  view / referrer / Core Web Vitals stats. **Do not enable it — neither
  setup mode is compatible with this site's CSP.** This bullet previously
  claimed Automatic setup "measures server-side"; that was wrong, and it is
  corrected here because a decision was very nearly made on it (2026-07-30).
  Both modes load the same beacon from
  `https://static.cloudflareinsights.com/beacon.min.js` — "Automatic" only
  means Cloudflare injects the tag into your HTML at the edge instead of you
  pasting it in. Cloudflare's own docs say "You may need to update your
  Content Security Policy settings to load this script." Under
  `script-src 'self'` the script is simply blocked, so the result is a
  console violation and no data. Two details worth recording so nobody
  re-derives them: the beacon POSTs to `/cdn-cgi/rum`, which is
  _same-origin_ on a proxied zone, so `connect-src 'self'` would actually
  permit the data leg — only the script load fails; and Web Analytics is
  genuinely cookie-free, so it is the "no beacon" and "no third-party
  requests" halves of the promise it breaks, not "no cookies". Adopting it
  would mean widening `script-src`, which contradicts
  [ADR 0002](./decisions/0002-csp-style-src-unsafe-inline.md) and
  [ADR 0008](./decisions/0008-externalize-hoisted-scripts-for-csp.md), and
  should not happen without an ADR of its own.

A third surface exists and is **on**, and since Web Analytics is ruled out
above it is the site's only page-level metric: **Workers Logs**
(`[observability]` in `wrangler.toml`, `enabled = true`). It retains Worker
invocation logs in the Cloudflare dashboard.

**What it covers.** Only the paths the Worker is invoked for. That is the
`run_worker_first` list in `wrangler.toml`: the apex redirect, security.txt,
and — listed purely to produce these logs — the `/en/*` and `/es/*` page
prefixes. Verified against `wrangler dev` on 2026-07-30 with a temporary
`console.log` probe: `/en/*` matches the bare `/en/` and the
percent-encoded `/es/colof%C3%B3n/`, while `/_astro/*`, `/fonts/*`,
`/og/*`, `/cmdk/*`, `/rss-*.xml`, `/sitemap*`, `/robots.txt` and unmatched
404 paths all bypass the Worker entirely. So this is a page-view log, not a
per-request log — the build puts zero non-HTML files under `/en` or `/es`,
which is what makes the prefixes a clean filter.

**Why it is compatible with the no-tracking posture.** It is retention of
requests the edge already sees and already aggregates via Zone Traffic
analytics above, not a new collection surface. Nothing client-side is
involved: no script ships, no cookie is set, no third-party host is
contacted. That is the whole reason it was chosen over Web Analytics.

**What it is not.** Retention is days, not months, and there is no
aggregation UI — you query it by hand. It answers "what happened this
week", not "what are my trends this quarter". A 404 at an unmatched path
produces no Worker log; Zone Traffic analytics still counts it at the edge.

**Turning it off.** Set `enabled = false` in `[observability]` **and**
delete the `[observability.logs]` / `[observability.traces]` sub-blocks.
Leaving the top level `false` with the sub-blocks enabled does **not**
disable logging — the nested `enabled` overrides the parent, which is the
state this config was in until 2026-07-30. Note that turning it off leaves
the site with no page-level metrics at all, and that the `/en/*` and
`/es/*` entries in `run_worker_first` exist only to feed it: if you disable
logging, remove them too or you are paying invocations for nothing.

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

`gitleaks-action@v2.3.9` is dormant and still targets Node 20. The
gitleaks step in `security.yml` carries
`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` at the step level — a
[documented GitHub opt-in](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)
that runs the action on Node 24 ahead of the 2026-06-02 forced
switch. Remove the env var once gitleaks-action ships a
Node-24-targeting release, or it becomes moot when Node 20 is
removed from runners on 2026-09-16.

The action runs `gitleaks detect` over the **full git history**, so it sees
field names that current files no longer use. `translationKey` was renamed to
`translationId` in #88, but historical commits still carry `translationKey:`
lines, which trip the default `generic-api-key` rule (the `…Key` gotcha in
CLAUDE.md). History is immutable, so `.gitleaks.toml` at the repo root
allow-lists that specific field assignment (kebab-slug value only) rather than
the rule or the files — a real high-entropy secret on any other line, or even
on a `translationKey:` line, still trips. The local pre-commit hook runs
`gitleaks protect --staged` (current diff only), so it never saw this; the
config makes both agree.

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

| Logical directive              | Cloudflare/Netlify `_headers`                                                                         | Vercel `vercel.json` `headers`                                           | nginx                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Strict CSP (script-src strict) | `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; …` | `{ "key": "Content-Security-Policy", "value": "default-src 'self'; …" }` | `add_header Content-Security-Policy "default-src 'self'; …" always;`   |
| HSTS preload                   | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`                             | same value, JSON object                                                  | `add_header Strict-Transport-Security "…" always;`                     |
| MIME sniffing off              | `X-Content-Type-Options: nosniff`                                                                     | same                                                                     | `add_header X-Content-Type-Options nosniff always;`                    |
| Referrer policy                | `Referrer-Policy: strict-origin-when-cross-origin`                                                    | same                                                                     | `add_header Referrer-Policy "strict-origin-when-cross-origin" always;` |
| Permissions policy             | `Permissions-Policy: accelerometer=(), camera=(), …`                                                  | same                                                                     | `add_header Permissions-Policy "…" always;`                            |
| Cross-origin opener            | `Cross-Origin-Opener-Policy: same-origin`                                                             | same                                                                     | `add_header Cross-Origin-Opener-Policy same-origin always;`            |
| Cross-origin resource          | `Cross-Origin-Resource-Policy: same-origin`                                                           | same                                                                     | `add_header Cross-Origin-Resource-Policy same-origin always;`          |
| Frame deny                     | `X-Frame-Options: DENY`                                                                               | same                                                                     | `add_header X-Frame-Options DENY always;`                              |
| Immutable fonts                | `/fonts/* … Cache-Control: public, max-age=31536000, immutable`                                       | `source: "/fonts/(.*)"`                                                  | same shape                                                             |

### CSP delivery — \_headers only

CSP is delivered **exclusively** by `public/_headers` at the edge. We do
not emit `<meta http-equiv="content-security-policy">` because Astro's
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
