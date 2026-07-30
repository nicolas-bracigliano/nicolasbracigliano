# Security notes

> **Current state vs. target state.** Reconciled against reality on
> 2026-07-30 — this file had drifted, describing as "pending" two things
> that were already live. Live now: **DNSSEC** (verified, chain of trust
> resolves), **commit signing** (enforced server-side by a repo ruleset),
> **zone traffic analytics** (collecting), and a **ruleset on `main`**
> covering signatures, force-push, deletion, review, and a required
> `preview` deployment. Still outstanding: a `required_status_checks` rule,
> which is the one thing ADR 0004's Renovate revisit is waiting on — see
> [Branch protection](#branch-protection) below. Each section states its own
> status; treat the section, not this banner, as authoritative.

## Commit signing

**Status**: **enforced server-side.** The `required_signatures` rule is
active on `main` via the repo ruleset (see
[Branch protection](#branch-protection)). Verified 2026-07-30.

This section previously read "local hook only, server-side enforcement
pending". That was stale — and worth knowing _why_ it looked pending, since
the same trap will catch the next person who checks:

```bash
# Says "Branch not protected" — this is the LEGACY api and returns 404
# for a repo protected by a ruleset. Not evidence of anything.
gh api repos/nicolas-bracigliano/nicolasbracigliano/branches/main/protection

# This is the one that tells the truth.
gh api repos/nicolas-bracigliano/nicolasbracigliano/rulesets
gh api repos/nicolas-bracigliano/nicolasbracigliano/rulesets/<id> --jq '.rules[].type'
```

The classic branch-protection UI page is empty for the same reason. Rulesets
live under Settings → Rules → Rulesets.

The `pre-push` hook in `lefthook.yml` is now a fast local feedback loop
rather than the only line of defence: it catches an unsigned commit before
you burn a push and a CI run, and the ruleset catches it regardless. Note
the hook only fires when `commit.gpgsign=true` is set locally, so a
contributor who hasn't configured signing gets a no-op locally and a hard
server-side rejection.

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

## Branch protection

**Status**: active as a **repo ruleset** named `Base`, targeting the default
branch. Created 2026-05-25, audited 2026-07-30.

| Rule                                                                                      | Effect                                |
| ----------------------------------------------------------------------------------------- | ------------------------------------- |
| `required_signatures`                                                                     | unsigned commits rejected             |
| `non_fast_forward`                                                                        | no force-push                         |
| `deletion`                                                                                | branch can't be deleted               |
| `pull_request` — 1 approval, code-owner review required, stale reviews not auto-dismissed | no direct pushes; review gate         |
| `required_deployments` — `preview`                                                        | the `preview` deployment must succeed |

**The gap, deliberately recorded:** there is **no `required_status_checks`
rule**. Nothing in the ruleset stops a PR merging with red CI — the enforced
gates are review and a successful `preview` deployment (which does mean the
build must at least pass). Test, Lighthouse, and e2e results are advisory as
far as the platform is concerned; today they hold because of discipline, not
configuration.

That gap is precisely what [ADR 0004](./decisions/0004-renovate-internal-automerge.md)'s
revisit is blocked on, and **that ADR's second postscript already recorded it
correctly** — it names the `Base` ruleset, notes the missing
`required_status_checks`, and explains that `platformAutomerge: true` without
it would let GitHub merge the moment Renovate enables auto-merge, before CI
completes. Treat ADR 0004 as the authority on the Renovate consequence; this
section is the inventory. `platformAutomerge: false` remains correct and
ADR 0004 needs no amendment — adding the rule is what unblocks it.

Worth noting how this file came to be wrong, since the same thing will happen
again: ADR 0004 knew branch protection was configured on 2026-05-25, while
the Commit signing section above went on claiming server-side enforcement was
"pending" for two more months. Nothing was inconsistent about the repo — only
about which document you happened to read. When you change a posture, grep
for every doc that asserts a status about it, not just the obvious one.

## DNSSEC

**Status**: **live and validating.** Verified 2026-07-30.

- DS record published at the TLD: keytag `2371`, `ECDSAP256SHA256`, digest
  type 2.
- A resolver query returns `AD: true` (authenticated data), meaning the
  chain of trust resolves end to end rather than merely being configured.

Verify with a **DoH** query rather than `dig`:

```bash
curl -sS -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=nicolasbracigliano.com&type=DS&do=true'
# expect: "AD": true, plus a DS record in Answer
```

`dig +dnssec` is the textbook command but is **not reliable from every
network** — an ISP that intercepts port-53 DNS can return forged or stale
answers even when you pass `@<authoritative-server>`, which makes a working
chain look broken. DoH runs over HTTPS on 443 and can't be intercepted the
same way, so it is the trustworthy check. Use `dig` only to cross-confirm a
DoH result, never as the sole signal.

How it was originally wired, kept for the record: enable DNSSEC for the zone
in the Cloudflare DNS dashboard, which produces a DS record (KSK); copy that
DS to the registrar for the apex domain. The chain goes live once the
registrar publishes the DS at the TLD level, usually within an hour.

## Vulnerability disclosure

Use the alias `security@nicolasbracigliano.com` (forward to primary inbox).
RFC 9116 expects a long-lived contact; an alias is easier to retire/rotate
than the primary address. The CI `security-txt-expires` job fails the build
if `Expires` is < 30 days away.

## Analytics

**Status**: zone is live and proxied (verified 2026-06-03 — Cloudflare
authoritative NS, apex on Cloudflare anycast, `server: cloudflare` +
`cf-ray` on every response). Page-level Web Analytics not yet toggled on.

Because the domain is a fully proxied zone, two server-side surfaces are
available with no JS, no cookies, no CSP loosening, no PII:

- **Zone Traffic analytics** (dashboard → zone → Analytics & Logs →
  Traffic) aggregates request / bandwidth / country / status-code stats
  from edge logs. On by default for any proxied zone — already collecting.
- **Web Analytics** (dashboard → Web Analytics) adds page-level
  view / referrer / Core Web Vitals stats. Enable it via **Automatic
  setup**, which Cloudflare offers for proxied hostnames and measures
  server-side. Do **not** use Manual setup: its beacon injects a
  `cloudflareinsights.com` script plus a `connect-src`, which breaks the
  strict CSP and the "no beacon, no cookies" promise (README, §16).

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
