import { describe, expect, it } from 'vitest';
import { ROUTES, otherLocale, buildHreflangAlternates } from '../../src/lib/routes';

describe('ROUTES', () => {
  it('mirrors every key in both locales', () => {
    for (const [key, pair] of Object.entries(ROUTES)) {
      expect(pair.en, key).toMatch(/^\/en\//);
      expect(pair.es, key).toMatch(/^\/es\//);
    }
  });

  it('uses localized Spanish segments', () => {
    expect(ROUTES.notes.es).toBe('/es/notas/');
    expect(ROUTES.works.es).toBe('/es/obras/');
    expect(ROUTES.about.es).toBe('/es/sobre/');
    expect(ROUTES.colophon.es).toBe('/es/colofón/');
    expect(ROUTES.essays.es).toBe('/es/ensayos/');
  });
});

describe('otherLocale', () => {
  it('flips en/es', () => {
    expect(otherLocale('en')).toBe('es');
    expect(otherLocale('es')).toBe('en');
  });
});

describe('buildHreflangAlternates', () => {
  it('emits en, es, x-default with absolute URLs', () => {
    const result = buildHreflangAlternates(
      'https://example.com',
      { locale: 'en', path: '/en/notes/hello/' },
      '/es/notas/hola/',
    );
    expect(result).toEqual([
      { hreflang: 'en', href: 'https://example.com/en/notes/hello/' },
      { hreflang: 'es', href: 'https://example.com/es/notas/hola/' },
      { hreflang: 'x-default', href: 'https://example.com/en/notes/hello/' },
    ]);
  });

  it('falls back to current path for missing translation', () => {
    const result = buildHreflangAlternates(
      'https://example.com',
      { locale: 'en', path: '/en/notes/orphan/' },
      null,
    );
    // Missing sibling: every alternate points at the current path (defensive).
    expect(result[1]?.href).toBe('https://example.com/en/notes/orphan/');
  });
});
