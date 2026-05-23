// Bilingual route map. Single source of truth for the IA — no astro:content
// imports so it stays unit-testable in plain vitest.

export type Locale = 'en' | 'es';
export const DEFAULT_LOCALE: Locale = 'en';

/** Contact email — single source of truth for the about-page CTA, the
 *  RFC 9116 security.txt rotation, and any future "say hi" surfaces. */
export const SITE_EMAIL = 'hola@nicolasbracigliano.com';

export const ROUTES = {
  home: { en: '/en/', es: '/es/' },
  notes: { en: '/en/notes/', es: '/es/notas/' },
  works: { en: '/en/works/', es: '/es/obras/' },
  about: { en: '/en/about/', es: '/es/sobre/' },
  now: { en: '/en/about/now/', es: '/es/sobre/ahora/' },
  colophon: { en: '/en/colophon/', es: '/es/colofón/' },
  essays: { en: '/en/essays/', es: '/es/ensayos/' },
} as const;

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
