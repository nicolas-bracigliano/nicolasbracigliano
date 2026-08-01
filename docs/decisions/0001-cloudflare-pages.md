# 0001 — Cloudflare Pages as host

**Status**: Superseded — the deployment target migrated to Cloudflare Workers Static Assets on 2026-05-24 (PR #49). See the **Postscript** at the bottom of this file for the migration. The host-level decision (Cloudflare's free tier with edge logic for the `/` redirect, DNSSEC + HSTS + server-side zone analytics) still stands; only the specific Cloudflare product changed. One stated differentiator was narrowed on 2026-07-30 — see the amendment note under **Alternatives considered**.
**Date**: 2026-05-21

## Context

This site needs hosting that satisfies several hard constraints from the design system:

- **Lighthouse ≥ 95** on every page (§4.6)
- **No third-party client-side scripts** (§4.6)
- **Strict CSP `default-src 'self'`** (§16)
- **HSTS preload + DNSSEC** (§16)
- **No client-side analytics** (§16)
- **≤ 100 KB gzipped per page** (§16)

And one soft constraint: zero ongoing cost while the site is a hobby.

We also need a small piece of edge logic — an `Accept-Language` redirect at `/` — so pure-static hosts (GitHub Pages, raw S3 + CloudFront) require client-side workarounds.

## Decision

Use **Cloudflare Pages** with one Pages Function for the `/` redirect. Static output via Astro 6 with `output: 'static'` (no SSR adapter).

## Alternatives considered

| Option                            | Why not                                                                                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**                        | Best DX for Astro, but Web Analytics is a paid client-side beacon and the egress pricing on a sudden traffic spike is steeper than Cloudflare's.                                                          |
| **Netlify**                       | Functionally similar to Cloudflare Pages but older and pricier at scale. Same lock-in story, fewer headline features.                                                                                     |
| **GitHub Pages**                  | Pure-static; no support for the `/` redirect as a server-side concern. Would need a client-side meta-refresh or unconditional default-locale, both worse UX. Also no edge headers, no DNSSEC integration. |
| **S3 + CloudFront + Lambda@Edge** | Fully composable, would satisfy every constraint, but the ops burden (cert renewal, CloudFront cache invalidation, Lambda deploys) is wildly disproportionate to a personal site.                         |
| **VPS + Caddy**                   | Same problem in a different shape — now we have a server to patch.                                                                                                                                        |

Cloudflare alone offers **server-side Web Analytics** (derived from edge logs with no client beacon, no cookie, no CSP loosening) — that's the genuine differentiator for the privacy stance, not just price.

> **Amended 2026-07-30 — this differentiator was overstated.** The claim conflates two different Cloudflare products, and only one of them is server-side.
>
> - **Zone Traffic analytics** _is_ server-side exactly as described: derived from edge logs, no beacon, no cookie, no CSP loosening, on by default for a proxied zone. This half of the claim holds, and it is collecting today.
> - **Web Analytics** — the page-level product named in the sentence above — is **not** server-side. Both of its setup modes load a beacon from `https://static.cloudflareinsights.com/beacon.min.js`; "Automatic setup" only means Cloudflare injects the tag into the HTML at the edge instead of you pasting it in. Under this site's `script-src 'self'` the script is blocked outright, so it cannot be adopted without widening the CSP — which would contradict [0002](./0002-csp-style-src-unsafe-inline.md) and [0008](./0008-externalize-hoisted-scripts-for-csp.md).
>
> Knock-on for the table above: the **Vercel** row is dinged for "Web Analytics is a paid client-side beacon". Cloudflare's is a _free_ client-side beacon. On that specific axis the comparison is free-versus-paid, not server-side-versus-beacon — Cloudflare still wins on cost, but the privacy gap between them is narrower than written.
>
> **The decision itself is unaffected.** It rests on the free tier, DNSSEC/HSTS as one-switch features, edge logic for the `/` redirect, an auditable `wrangler` deploy, and `output: 'static'` portability — none of which depend on this claim. What changed is the honest scope of the analytics advantage: aggregate zone data, not page-level. Page-level metrics now come from Worker invocation logs instead; see `docs/security.md § Analytics` for that trade-off and why the beacon route stays closed.

## Consequences

**What we accept:**

- Five files are Cloudflare-specific. At the time this ADR was written: `functions/index.ts`, `public/_headers`, `public/_redirects`, `wrangler.toml`, `.github/workflows/ci.yml`'s deploy job. After the Workers migration (see Postscript), `functions/index.ts` was replaced by `src/worker.ts`; the rest of the lock-in surface is unchanged. See `docs/security.md § Lock-in surface and escape plan`.
- Renovate's `platformAutomerge: false` because branch protection wasn't configured at the time. See [0004](./0004-renovate-internal-automerge.md) and that ADR's postscript for the post-public revisit.
- Cloudflare's Free-tier rules can change. Mitigation: the redirect can degrade to a static shim if Pages Functions ever go paid. Astro `output: 'static'` keeps the rest of the site totally portable.

**What we gain:**

- Free tier indefinitely at this site's traffic.
- Server-side analytics (the unique feature). _Amended 2026-07-30: true of **zone traffic** analytics only — the page-level Web Analytics product is beacon-based. See the amendment note under Alternatives considered._
- DNSSEC, HSTS preload, edge DDoS, brotli — all first-class with one switch.
- `wrangler` deploy from GitHub Actions, not the git integration → the build artefact is auditable.

## When to revisit

- We add SSR (`output: 'server'` or `'hybrid'`) — at that point the Astro adapter binds us to one host. Hold the line on static.
- Cloudflare reprices the Workers free tier — the `/` redirect falls back to a static shim cheaply (was true under Pages Functions, still true under Workers Static Assets).
- The site needs CDN-level personalisation (cookies, A/B) — that's when the lock-in becomes load-bearing.

## Postscript — 2026-05-24

The deployment target moved from **Cloudflare Pages + Pages Function** to **Cloudflare Workers Static Assets** in PR #49 (`feat(ci): migrate Cloudflare Pages → Workers Static Assets (Path A)`). Triggers:

- Cloudflare's onboarding flow steers new accounts directly to Workers, even when the workload is "ship a static `dist/` directory + a tiny edge function." Pages still works, but reads as the legacy path.
- The Workers Static Assets binding (`[assets] directory = "./dist"` in `wrangler.toml`) collapses the previous "two products glued together" into one Worker that delegates non-`/` paths via `env.ASSETS.fetch(request)`.
- `wrangler versions upload --preview-alias=preview` gives every PR a stable preview URL out of the box — the Pages equivalent required project-level configuration that the free tier didn't expose.

What stayed the same: the host (Cloudflare, free tier), the constraints driving the Decision section above (Lighthouse, CSP, DNSSEC, etc.), and the per-build deploy from `wrangler` in CI. The lock-in surface narrowed by one file (`functions/index.ts` → `src/worker.ts`); the rest is identical.

What changed in the workflow:

- `wrangler deploy` for `main`; `wrangler versions upload --preview-alias=preview` for PRs (single shared preview alias rather than per-PR DNS names).
- `wrangler.toml` gained `run_worker_first = true` so the Worker fires for every request (PR #54). Without it, the `/` redirect was dead code: Workers Static Assets' default `not_found_handling = "404-page"` bypasses the Worker when no asset matches. **Amended 2026-07-30:** narrowed from `true` to an explicit list. `true` was routing every asset request through the Worker only to fall through to `env.ASSETS.fetch()`, paying an invocation and a hop for ~100% of traffic. The fix for the original bug is unchanged; only its blast radius narrowed. The list is `["/", "/.well-known/security.txt", "/en/*", "/es/*"]`: the first two are the paths `src/worker.ts` actually branches on, and the two locale prefixes are there _only_ so page views still generate a Workers Logs entry — a Worker invocation is the sole page-level metric available without loading a beacon that `script-src 'self'` would block (see `docs/security.md § Analytics`). Assets are excluded, so this costs roughly a tenth of the invocations `true` did while capturing 100% of page views.
- All five inline-script blocks on the prototype-parity routes had to be externalized because Workers Static Assets serves `_headers` at the edge consistently. See [0008](./0008-externalize-hoisted-scripts-for-csp.md) for the full story.

This ADR stays in place as the host-level decision record. The product-level switch is captured here rather than as a new ADR because the "what we accept / what we gain" table didn't change materially.
