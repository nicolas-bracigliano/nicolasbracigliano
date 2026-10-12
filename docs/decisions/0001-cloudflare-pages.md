# 0001 — Static hosting with a thin edge adapter

**Status**: Superseded — Cloudflare Pages was replaced by Cloudflare Workers Static Assets on 2026-05-24 (PR #49).
**Date**: 2026-05-21

## Context

The site needs static hosting, response headers, and a small server-side
`Accept-Language` redirect at `/`. Client-side scripts and ongoing operational
work should stay minimal.

## Decision

The original deployment used Cloudflare Pages. The current deployment uses
Cloudflare Workers Static Assets with Astro's `output: 'static'` and no SSR
adapter. [`src/worker.ts`](../../src/worker.ts) adapts platform-neutral helpers
to the host and delegates other requests to the asset binding.

## Consequences

Hosting configuration lives in [`wrangler.toml`](../../wrangler.toml),
[`public/_headers`](../../public/_headers),
[`public/_redirects`](../../public/_redirects), and the deployment workflow.
A move to another host would replace those platform-specific pieces while
retaining the static build and pure routing helpers.

The site ships no client-side analytics beacon. Server-side observability is
configured in `wrangler.toml`.

## Alternatives considered

Pure static hosting would need another solution for the locale redirect and
response headers. A managed server would add maintenance disproportionate to
this site's needs.
