// Bilingual route map. Single source of truth for the IA — no astro:content
// imports so it stays unit-testable in plain vitest.

export type Locale = 'en' | 'es';
export const DEFAULT_LOCALE: Locale = 'en';

/** Contact email — single source of truth for the about-page CTA, the
 *  RFC 9116 security.txt rotation, and any future "say hi" surfaces. */
export const SITE_EMAIL = 'hola@nicolasbracigliano.com';

// IMPORTANT: when adding a new route here, also update the
// hardcoded path list in `.github/workflows/ci.yml`'s "Smoke
// test (routes)" step. The smoke list runs `curl` against the
// live deploy and has no module access — it can't import from
// here. `docs/ci.md` § "Deploy specifics" flags this as a known
// maintenance dependency.
export const ROUTES = {
  home: { en: '/en/', es: '/es/' },
  notes: { en: '/en/notes/', es: '/es/notas/' },
  works: { en: '/en/works/', es: '/es/obras/' },
  about: { en: '/en/about/', es: '/es/sobre/' },
  now: { en: '/en/about/now/', es: '/es/sobre/ahora/' },
  colophon: { en: '/en/colophon/', es: '/es/colofón/' },
  essays: { en: '/en/essays/', es: '/es/ensayos/' },
} as const;

/** The slugs that live in the `pages` content collection.
 *  Single source of truth shared by:
 *   - `src/content.config.ts` (the discriminated-union variants)
 *   - `src/lib/i18n.ts` (the `isPageSlug` runtime type guard)
 *   - `tests/unit/page-slugs.test.ts` (drift detection against
 *     the actual `src/content/pages/{en,es}/*.md` files)
 *
 *  Adding a new page (e.g. when `/essays` gets its real
 *  treatment): append the slug here, add a matching variant in
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
