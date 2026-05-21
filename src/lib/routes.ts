// Bilingual route map. Single source of truth for the IA — no astro:content
// imports so it stays unit-testable in plain vitest.

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const ROUTES = {
  home: { en: '/en/', es: '/es/' },
  notes: { en: '/en/notes/', es: '/es/notas/' },
  works: { en: '/en/works/', es: '/es/obras/' },
  about: { en: '/en/about/', es: '/es/sobre/' },
  now: { en: '/en/about/now/', es: '/es/sobre/ahora/' },
  colophon: { en: '/en/colophon/', es: '/es/colofón/' },
  essays: { en: '/en/essays/', es: '/es/ensayos/' },
} as const;

export type RouteKey = keyof typeof ROUTES;

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}

export function indexRouteFor(collection: 'notes' | 'works' | 'essays', locale: Locale): string {
  return ROUTES[collection][locale];
}

export type LangAlternate = {
  hreflang: 'en' | 'es' | 'x-default';
  href: string;
};

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
