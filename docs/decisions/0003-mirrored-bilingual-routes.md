# 0003 — Mirrored `/en` `/es` route trees with `ROUTES` map

**Status**: Accepted
**Date**: 2026-05-21
**Amended**: 2026-08-12 — Build notes renamed; legacy paths retained as permanent redirects.

## Context

The site is bilingual (English + Spanish, design system §5) with **localised URL segments**: `/en/notes/` ↔ `/es/notas/`, `/en/works/` ↔ `/es/obras/`, `/en/build/` ↔ `/es/como-esta-hecho/`, `/en/about/now/` ↔ `/es/sobre/ahora/`, etc. Spanish paths use natural Spanish words or phrases rather than copying the English segment.

We also need:

- Per-page `<link rel="alternate" hreflang>` to the sibling translation
- A "missing translation" fallback (when an entry is published in only one language, design system §5)
- The pages collection's `home`/`about`/`now`/`build` slugs must map to per-locale URLs (not just `/{lang}/{slug}/`)

## Decision

- Each locale has a **separate `src/pages/` subtree** with localised segments: `src/pages/en/notes/`, `src/pages/es/notas/`, etc. Each subtree mirrors the other in structure but uses native-language path segments.
- A **typed `ROUTES` map in `src/lib/routes.ts`** is the single source of truth for the IA:

  ```ts
  export const ROUTES = {
    home: { en: '/en/', es: '/es/' },
    notes: { en: '/en/notes/', es: '/es/notas/' },
    works: { en: '/en/works/', es: '/es/obras/' },
    about: { en: '/en/about/', es: '/es/sobre/' },
    now: { en: '/en/about/now/', es: '/es/sobre/ahora/' },
    build: { en: '/en/build/', es: '/es/como-esta-hecho/' },
    pieces: { en: '/en/pieces/', es: '/es/ensayos/' },
  } as const;
  ```

- Layouts, nav, language toggle, and hreflang alternates consume `ROUTES` directly.
- A `findSiblingIn(entry, all)` helper resolves the translation pair via the `translationId` frontmatter field; missing siblings show a disabled-style language toggle with a one-line "Only in {language}" note.

## Alternatives considered

| Option                                                               | Why not                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Astro's built-in `i18n.routing` with `prefixDefaultLocale: true`** | Astro 6's i18n routing handles the locale-prefix part (`/en/`, `/es/`) but **doesn't support localised path segments** — every locale has to use the same URL after the prefix (`/en/works/` and `/es/works/`, not `/es/obras/`). The design system explicitly requires Spanish path segments. Astro's helper wouldn't get us there. |
| **Runtime translation via `Astro.preferredLocale`**                  | Would mean serving the same HTML and swapping strings client-side. Breaks SEO (Google won't index two languages on one URL), breaks the "language toggle persists choice" UX, and re-introduces the JS we explicitly avoid.                                                                                                          |
| **Single tree with rewrites in `_redirects`**                        | `/es/obras/` → `/works/?lang=es` rewrites. Works but adds runtime indirection, query-string state, and a fragile coupling to Cloudflare's URL rewriting semantics.                                                                                                                                                                   |
| **`getRelativeLocaleUrl()` from `astro:routing`**                    | Only handles locale prefix, not segments. Combines awkwardly with our localised paths.                                                                                                                                                                                                                                               |

The `ROUTES` constant solves three problems at once: typed lookup for navigation, source of truth for hreflang alternates, and a clear extension point when adding a 5th language or a new route.

## Consequences

**What we accept:**

- **Adding a route is a four-step change**: (1) add to `ROUTES`, (2) create the page in `/en/`, (3) create the page in `/es/`, (4) write the content in both languages. If you forget any of these, CI catches it: the `findSiblingIn` test fails if a `translationId` is published without its sibling.
- **Renamed routes need permanent redirects.** The former `/en/colophon/`, `/es/colofón/`, and unaccented `/es/colofon/` variants redirect to the Build notes routes in `src/worker.ts`; equivalent percent-encoded rules remain in `public/_redirects` as an asset-layer fallback. The Worker owns the behavior because Cloudflare receives the accented path percent-encoded and does not match a raw-Unicode `_redirects` source. The post-deploy smoke test checks every legacy form and its `Location` header.
- **No automatic locale fallback**. If the user requests `/es/essays/` and we only have `/en/essays/` content, they see the empty index page — not the English fallback. This is intentional per design system §2 ("Not bilingual in the half-measure sense"): either a page exists in both languages or the language toggle disables itself.

**What we gain:**

- URL-level honesty about content language (great for SEO, screen readers, link-sharing).
- Per-locale routing that natively works with Astro's `getStaticPaths`.
- Trivially extensible to a third locale: add it to `ROUTES`, mirror the page tree, add the content.

## When to revisit

- We adopt a 4th language and the duplication starts hurting. At that point, build a small code-gen step that emits the per-locale page files from a single template + `ROUTES` map.
- Astro adds segment-translation support to its i18n routing — could simplify by migrating, _if_ the missing-translation UX is preserved.
