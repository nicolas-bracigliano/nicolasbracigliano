import { describe, expect, it } from 'vitest';
import { ROUTES, otherLocale } from '../../src/lib/routes';

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
