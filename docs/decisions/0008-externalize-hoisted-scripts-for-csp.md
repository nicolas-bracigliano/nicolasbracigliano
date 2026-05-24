# 0008 — Externalize every hoisted `<script>` so production CSP allows it

**Status**: Accepted
**Date**: 2026-05-24

## Context

`public/_headers` enforces `Content-Security-Policy: script-src 'self'`. No `'unsafe-inline'`, no per-page hashes, no nonces — only same-origin script files are allowed to execute. That's the security posture from ADR [[0002]]: the `style-src` directive carries the cost of supporting `<ClientRouter />`'s runtime view-transition styles, and `script-src` stays strict in exchange.

Astro 5+ behaviour collides with this. The `plugin-scripts` bundler step inlines a hoisted `<script>` chunk directly into the HTML whenever its byte length is below `vite.build.assetsInlineLimit` (default `4096`). Every page-level script in the codebase fell under that threshold and shipped as `<script type="module">…</script>` blocks:

- `chrome.ts` runtime (theme apply + foot-rail scroll listener + cross-tab sync)
- `AboutIntro` (the "hola." overlay)
- Home masthead's wall-clock + bench-card `IntersectionObserver`
- `WorksFilters` (works-page filter toolbar)
- 404 page's `window.location.pathname` writer

Locally everything worked — the dev server (`astro dev`, `astro preview`, `wrangler dev` with hot-reload) doesn't serve `public/_headers`. Once deployed to the Worker, the browser blocked every inline module with `Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'"`. Five user-visible features broke silently: the wall-clock froze at the placeholder, animations never armed, theme reconciliation on `astro:page-load` stopped, works filters no-opped, the 404 page never filled the requested path.

## Decision

Set `vite.build.assetsInlineLimit: 0` in `astro.config.ts`. Every hoisted `<script>` now emits as an external `/_astro/*.js` chunk, which `script-src 'self'` allows.

This makes the byte-length threshold zero — `Buffer.byteLength(code) < 0` is always false, so `shouldInlineAsset` (Astro's gating function in `plugins/util.js`) always returns `false` for every chunk. Verified by reading the plugin source; no chunk in the build will be inlined regardless of size.

A regression test in `tests/e2e/smoke.spec.ts` asserts every published route plus `/404.html` ships zero `<script>` elements with inline bodies. If a future config change re-enables inlining (or a new page introduces an inline `<script>` block bypassing this constraint), CI fails before the next deploy ships a broken page.

## Alternatives considered

| Option                                                                                        | Why not                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Astro's `security.csp`** (auto-emits per-page meta CSP with hashes for every inline script) | Documented incompatible with `<ClientRouter />` — same reason ADR [[0002]] rejected it for styles. Astro's docs say so explicitly.                                                                                                                               |
| **CSP `'strict-dynamic'` + nonce**                                                            | The modern CSP recommendation. Requires injecting a fresh nonce per response, which means dropping back to Worker-handled responses (we just got off that path with PR #49 → Workers Static Assets). The cost of re-doing the Worker tier outweighs the benefit. |
| **Per-script SHA-256 hashes in `_headers`**                                                   | Hashes change on every build (minifier output isn't byte-stable across Astro versions). Would need a `postbuild` step that scans `dist/**/*.html` and rewrites `_headers`. Brittle automation for a problem the simpler config knob already solves.              |
| **Externalize manually**: move each inline script to a hand-written file in `public/`         | Loses TypeScript, loses Astro's bundling. Trades correctness for ergonomics in the wrong direction.                                                                                                                                                              |
| **Add `'unsafe-inline'` to `script-src`**                                                     | Defeats CSP. `script-src` is the directive that protects against XSS execution; loosening it is not a real option.                                                                                                                                               |

## Consequences

**Accepted cost:**

- Two extra HTTP requests per page (`page.js` chunk + `BaseLayout.js` chunk) versus the inline-script baseline. Both are static, cacheable, served from the same Worker. Measured impact via Lighthouse: `resource-summary.script.size` went from ~6.8 KB to ~10.4 KB transferred on the home page. Documents shrank by the same amount. Net transfer unchanged. Performance score stays at 1.0.
- `assetsInlineLimit: 0` is the global Vite knob, not script-specific. It also disables inlining for any future `import logo from './asset.svg?inline'` patterns. Today no such imports exist; if one is added, it'll silently emit as an external file. The comment in `astro.config.ts` flags this.

**Compensating controls:**

- The regression test in `tests/e2e/smoke.spec.ts` (sweep across all 13 routes) catches re-introduction of inline scripts.
- Lighthouse `script.size` budget bumped from 10 KB to 14 KB to accommodate the externalized bytes. Documented in `lighthouserc.json`.
- The decision is captured here; the next contributor who sees `assetsInlineLimit: 0` and considers bumping it for perf will land on this ADR via the comment in `astro.config.ts`.

**Operational:**

- Every new `<script>` block in an `.astro` file emits as an external chunk. No author action required.
- A script that explicitly opts out via `is:inline` keeps that semantic — but only `<script is:inline src="…">` (external) is safe under CSP; inline bodies with `is:inline` still ship inline. `public/theme-init.js` is the canonical example: `is:inline` with `src` to keep the pre-paint FOUC blocker out of Vite's bundling, hand-authored as ES5, served as a same-origin file.

## When to revisit

- Astro ships first-class CSP support that handles `<ClientRouter />`'s runtime styles deterministically. Then per-script hashes via `security.csp` become viable and we can drop this knob.
- We move off Cloudflare Workers Static Assets to a runtime that lets us inject CSP nonces per response cheaply. Then `'strict-dynamic'` becomes the cleaner posture.
- A reproducible byte-stable Astro minifier output lands. Then a hash-pinning postbuild step is sustainable.
