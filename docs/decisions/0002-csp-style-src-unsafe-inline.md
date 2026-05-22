# 0002 — Loosen `style-src` to enable native View Transitions

**Status**: Accepted
**Date**: 2026-05-22

## Context

Two goals collide:

1. **Strict CSP** (design system §16): `default-src 'self'; script-src 'self'; style-src 'self'` — no inline anything, defence-in-depth against XSS.
2. **Polished cross-page motion**: the prototype's experience depends on continuous chrome and smooth page transitions, not jarring full reloads.

We adopted Astro 6's `<ClientRouter />` to drive native View Transitions API. This works — but `<ClientRouter />` injects per-build view-transition styles at runtime (the `[data-astro-transition-scope]` selectors), and Astro 6's `security.csp` _cannot hash them at build time_. Astro's own docs flag this as a documented incompatibility.

We also discovered a CSP spec quirk: **`'unsafe-inline'` is silently ignored** in `style-src` when any `'sha256-…'` hash is also present in the same directive. So mixing the two (Astro's auto-emitted hashes + an `'unsafe-inline'` fallback for the runtime styles) doesn't permit anything — the hashes win and the runtime styles get blocked.

## Decision

- Drop Astro's `security.csp` block entirely. The per-page `<meta http-equiv>` CSP is gone.
- `public/_headers` becomes the **sole** source of truth for CSP, served at the Cloudflare edge.
- `script-src 'self'` stays strict (the real XSS attack surface — script execution).
- `style-src 'self' 'unsafe-inline'` — the loosened directive, permitting runtime view-transition styles.

## Alternatives considered

| Option                                                                                  | Why not                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Roll our own ~30-line native View Transitions wrapper**                               | Keeps `style-src 'self'`. But ClientRouter does more than VTAs: link interception, head merging, scroll/focus/popstate, prefetch. Rebuilding all that ourselves is real maintenance for the equivalent UX.                                                                |
| **Drop `<ClientRouter />` entirely**                                                    | Lose cross-page Mark morph + smooth fades. Page-load animations + hover effects + scroll-driven reveals would still work, delivering ~80% of the "site feels animated" experience without the CSP cost. Reasonable fallback if we ever decide the lock-in isn't worth it. |
| **Keep Astro's `security.csp` and add `'unsafe-inline'` to `styleDirective.resources`** | Tried it. CSP spec ignored `'unsafe-inline'` because hashes were present. Doesn't work in practice.                                                                                                                                                                       |
| **Use SVG `<mask>` everywhere instead of inline styles**                                | Solves a smaller problem (one icon's masking technique). Doesn't address ClientRouter's runtime style injection.                                                                                                                                                          |

## Consequences

**Accepted weakness:**

- CSS injection via XSS becomes attack-surface in theory. On this site:
  - No user-input forms (no XSS injection point)
  - No auth/sessions (nothing to phish)
  - `img-src 'self'` already blocks the classic `background-image: url(evil.com)` exfiltration vector
  - The CSS-injection attack surface is _effectively nil_ — there's nothing to exfiltrate or impersonate via CSS

**Compensating controls:**

- `script-src 'self'` stays strict — the real attack surface (script execution) is untouched. This is the security property that matters.
- `frame-ancestors 'none'` in `_headers` prevents clickjacking.
- Other directives (`base-uri`, `form-action`, `upgrade-insecure-requests`) remain strict.

**Documentation:**

- `docs/security.md § Why style-src 'unsafe-inline'` explains the trade-off
- `docs/design-system.md §16` change-log entry on 2026-05-22 records the spec change

## When to revisit

- Astro ships a CSP-compatible View Transitions implementation (hash the runtime styles deterministically, or use nonce-based CSP).
- We add user input to the site (forms, comments, search) — CSS injection surface becomes non-trivial; revisit the trade-off.
- A different motion library appears that's both CSP-clean and full-featured.
