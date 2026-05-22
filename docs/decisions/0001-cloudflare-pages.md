# 0001 — Cloudflare Pages as host

**Status**: Accepted
**Date**: 2026-05-21

## Context

This site needs hosting that satisfies several hard constraints from the design system:

- **Lighthouse ≥ 95** on every page (§4.6)
- **No third-party client-side scripts** (§4.6)
- **Strict CSP `default-src 'self'`** (§16)
- **HSTS preload + DNSSEC** (§16)
- **No client-side analytics** (§16)
- **≤ 100 KB gzipped per page** (§16)

And one soft constraint: zero ongoing cost while the site is a hobby (private GitHub repo, no GitHub Pro yet).

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

## Consequences

**What we accept:**

- Five files are Cloudflare-specific: `functions/index.ts`, `public/_headers`, `public/_redirects`, `wrangler.toml`, `.github/workflows/ci.yml`'s deploy job. See `docs/security.md § Why Cloudflare Pages — lock-in surface and escape plan`.
- Renovate's `platformAutomerge: false` because we don't have branch protection (private repo, no GitHub Pro). See [0004](./0004-renovate-internal-automerge.md).
- Cloudflare's Free-tier rules can change. Mitigation: the redirect can degrade to a static shim if Pages Functions ever go paid. Astro `output: 'static'` keeps the rest of the site totally portable.

**What we gain:**

- Free tier indefinitely at this site's traffic.
- Server-side analytics (the unique feature).
- DNSSEC, HSTS preload, edge DDoS, brotli — all first-class with one switch.
- `wrangler` deploy from GitHub Actions, not the git integration → the build artefact is auditable.

## When to revisit

- We add SSR (`output: 'server'` or `'hybrid'`) — at that point the Astro adapter binds us to one host. Hold the line on static.
- Cloudflare reprices Pages Functions — the redirect falls back to a static shim cheaply.
- The site needs CDN-level personalisation (cookies, A/B) — that's when the lock-in becomes load-bearing.
