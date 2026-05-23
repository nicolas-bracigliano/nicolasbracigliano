// Bilingual route map. Single source of truth for the IA — no astro:content
// imports so it stays unit-testable in plain vitest.

export type Locale = 'en' | 'es';
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

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}
