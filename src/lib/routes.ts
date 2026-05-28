// Bilingual route map. Single source of truth for the IA — no astro:content
// imports so it stays unit-testable in plain vitest.

export type Locale = 'en' | 'es';
export const DEFAULT_LOCALE: Locale = 'en';

/** Contact email — single source of truth for the about-page CTA, the
 *  RFC 9116 security.txt rotation, and any future "say hi" surfaces. */
export const SITE_EMAIL = 'hola@nicolasbracigliano.com';

// Single source of truth consumed by `scripts/smoke-routes.ts`
// (post-deploy CI smoke), the `pages` content schema, the chrome
// nav, hreflang alternates, and the OG image route. Adding a
// route here is mechanically picked up by all of those — no
// parallel list to update.
export const ROUTES = {
  home: { en: '/en/', es: '/es/' },
  notes: { en: '/en/notes/', es: '/es/notas/' },
  works: { en: '/en/works/', es: '/es/obras/' },
  about: { en: '/en/about/', es: '/es/sobre/' },
  now: { en: '/en/about/now/', es: '/es/sobre/ahora/' },
  colophon: { en: '/en/colophon/', es: '/es/colofón/' },
  // `pieces` (EN) · `ensayos` (ES) — asymmetric per ADR 0010.
  // ES `ensayo` keeps the older meaning (an attempt, a rehearsal) which
  // is on-brand for §6 ("admit uncertainty over polish"); EN `essay`
  // accreted school/thought-leadership baggage that fights the spirit
  // of the site. `pieces` returns the craft register alongside `works`.
  pieces: { en: '/en/pieces/', es: '/es/ensayos/' },
} as const;

/** The slugs that live in the `pages` content collection.
 *  Single source of truth shared by:
 *   - `src/content.config.ts` (the discriminated-union variants)
 *   - `src/lib/i18n.ts` (the `isPageSlug` runtime type guard)
 *   - `tests/unit/page-slugs.test.ts` (drift detection against
 *     the actual `src/content/pages/{en,es}/*.md` files)
 *
 *  Adding a new page (e.g. when `/pieces` gets its own pages-collection
 *  entry): append the slug here, add a matching variant in
 *  `content.config.ts`, and add the markdown files in
 *  `src/content/pages/{en,es}/`. The drift test fails until all
 *  three are in sync. */
export const PAGE_SLUGS = ['home', 'about', 'colophon', 'now'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}

export type LangAlternate = {
  hreflang: 'en' | 'es' | 'x-default';
  href: string;
};

/** Single source of truth for hreflang alternates. Falls back to the
 *  current path for the missing-sibling case so each page always emits
 *  three `<link rel="alternate">` tags. Future consumers (sitemap, RSS,
 *  OG metadata) should call this rather than re-deriving. */
export function buildHreflangAlternates(
  siteOrigin: string,
  current: { locale: Locale; path: string },
  siblingPath: string | null,
): LangAlternate[] {
  const enPath = current.locale === 'en' ? current.path : (siblingPath ?? current.path);
  const esPath = current.locale === 'es' ? current.path : (siblingPath ?? current.path);
  return [
    { hreflang: 'en', href: `${siteOrigin}${enPath}` },
    { hreflang: 'es', href: `${siteOrigin}${esPath}` },
    { hreflang: 'x-default', href: `${siteOrigin}${enPath}` },
  ];
}
