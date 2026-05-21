# Security notes

## Commit signing

SSH commit signing is enforced server-side via branch protection on `main`.
The local mirror is the `pre-push` hook in `lefthook.yml` — it refuses to
push unsigned commits as a fast feedback loop.

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

Enable DNSSEC for `nicolasbracigliano.com` in the Cloudflare DNS dashboard.
Cloudflare will produce a DS record (KSK). Copy that DS record to the registrar
for the apex domain. The chain of trust is live once the registrar publishes
the DS at the TLD level (usually within an hour).

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

Cloudflare Web Analytics is enabled in **server-side mode** for the zone.
Aggregates pageview / referrer / country stats from edge logs at the proxy
— no JS, no cookies, no CSP loosening, no PII.

## Draft preview

`getStaticPaths` filters on `status: 'published'`, so drafts are invisible
locally too. To preview a draft, flip `status: published` in a working copy,
do not commit, run `pnpm dev`.

## Token rotation

- **Cloudflare API token** — scoped to Pages on `nicolas-bracigliano` only. Rotate annually
  or on staff change. Rotate immediately on suspected leak.
- **GitHub Actions tokens** — workflows use `permissions: {}` at the top and
  only request the minimum scope per job. Audit on each PR that touches `.github/workflows/`.

## Host-neutral header directives

The `public/_headers` file uses Cloudflare/Netlify syntax. If you ever move the
site, this table is the host-neutral source of truth for what each directive
needs to look like on the new host. Update both columns in lock-step.

| Logical directive               | Cloudflare/Netlify `_headers`                                             | Vercel `vercel.json` `headers`                                           | nginx                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Strict CSP (no `unsafe-inline`) | `Content-Security-Policy: default-src 'self'; …`                          | `{ "key": "Content-Security-Policy", "value": "default-src 'self'; …" }` | `add_header Content-Security-Policy "default-src 'self'; …" always;`                              |
| HSTS preload                    | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` | same value, JSON object                                                  | `add_header Strict-Transport-Security "…" always;`                                                |
| MIME sniffing off               | `X-Content-Type-Options: nosniff`                                         | same                                                                     | `add_header X-Content-Type-Options nosniff always;`                                               |
| Referrer policy                 | `Referrer-Policy: strict-origin-when-cross-origin`                        | same                                                                     | `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`                            |
| Permissions policy              | `Permissions-Policy: accelerometer=(), camera=(), …`                      | same                                                                     | `add_header Permissions-Policy "…" always;`                                                       |
| Cross-origin opener             | `Cross-Origin-Opener-Policy: same-origin`                                 | same                                                                     | `add_header Cross-Origin-Opener-Policy same-origin always;`                                       |
| Cross-origin resource           | `Cross-Origin-Resource-Policy: same-origin`                               | same                                                                     | `add_header Cross-Origin-Resource-Policy same-origin always;`                                     |
| Frame deny                      | `X-Frame-Options: DENY`                                                   | same                                                                     | `add_header X-Frame-Options DENY always;`                                                         |
| Immutable Pagefind              | `/_pagefind/* … Cache-Control: public, max-age=31536000, immutable`       | per-route entry with `source: "/_pagefind/(.*)"`                         | `location /_pagefind/ { add_header Cache-Control "public, max-age=31536000, immutable" always; }` |
| Immutable fonts                 | `/fonts/* … Cache-Control: public, max-age=31536000, immutable`           | `source: "/fonts/(.*)"`                                                  | same shape                                                                                        |

The CSP is _additionally_ emitted per-page via `<meta http-equiv>` by Astro 6's
`security.csp` config — so even if a future host doesn't honour `_headers`,
script/style hashes ship in the HTML.

## Why Cloudflare Pages — lock-in surface and escape plan

Cloudflare Pages was chosen because:

- Free tier covers a personal site indefinitely.
- Server-side Web Analytics (zero JS, zero cookies) is unique to Cloudflare.
- DNSSEC + HSTS preload + edge DDoS protection are first-class.
- One Pages Function handles the `/` Accept-Language redirect — no SSR adapter,
  no framework lock-in for the rest of the site.
- We deploy via `wrangler` from GitHub Actions, not the git integration, so the
  build artefact is auditable.

The lock-in surface is **5 files**:

| File                           | What's Cloudflare-specific                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `functions/index.ts`           | `PagesFunction` type + `onRequest` named export. The actual logic is in `src/lib/pick-locale.ts` as a platform-neutral `EdgeHandler`. |
| `public/_headers`              | Cloudflare/Netlify syntax. See table above.                                                                                           |
| `public/_redirects`            | Same syntax family.                                                                                                                   |
| `wrangler.toml`                | Cloudflare CLI config.                                                                                                                |
| `.github/workflows/deploy.yml` | Uses `cloudflare/wrangler-action`.                                                                                                    |

### Escape plan (half a day's work to port to another static host)

1. **Delete** `functions/`, `public/_headers`, `public/_redirects`, `wrangler.toml`.
2. **Rewrite the redirect** against the new platform's edge runtime. Import
   `acceptLanguageRedirect` from `src/lib/pick-locale.ts` and write the
   platform's 5-line adapter (Vercel Edge, Netlify Edge, Deno Deploy, Bun,
   plain Worker — all speak `Request`/`Response`). If the new host has no
   edge runtime, render a `<meta http-equiv="refresh">` shim at `/` or
   default to `/en/`.
3. **Translate headers** to the new host's syntax using the table above.
4. **Swap the deploy workflow** to the host's GitHub Action (e.g.
   `actions/deploy-pages` for GitHub Pages, `amondnet/vercel-action` for
   Vercel).

### When to revisit the choice

- You add SSR (`output: 'server'` or `'hybrid'`) — at that point the Astro
  adapter binds you to one host. Hold the line on `output: 'static'`.
- Cloudflare reprices Pages Functions — the redirect falls back to a static
  shim cheaply.
- The site needs CDN-level personalisation (cookies, A/B) — that's when
  Cloudflare's lock-in starts being load-bearing instead of cosmetic.
