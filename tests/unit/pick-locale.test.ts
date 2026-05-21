import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  acceptLanguageRedirect,
  createAcceptLanguageRedirect,
  pickLocale,
} from '../../src/lib/pick-locale';

describe('pickLocale (pure helper)', () => {
  it('returns default when header is null', () => {
    expect(pickLocale(null, SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('returns default when header is empty', () => {
    expect(pickLocale('', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('matches primary language tag, ignoring region', () => {
    expect(pickLocale('es-AR,es;q=0.9,en;q=0.7', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
    expect(pickLocale('en-AU', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('respects q-value ordering', () => {
    // fr unsupported → fall through to es (higher q than en)
    expect(pickLocale('fr;q=1.0,es;q=0.8,en;q=0.5', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
  });

  it('falls back to default on unknown languages', () => {
    expect(pickLocale('fr-FR,fr;q=0.9', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('is generic over the locale string-literal union', () => {
    type ThreeLang = 'en' | 'es' | 'ja';
    const supported: readonly ThreeLang[] = ['en', 'es', 'ja'];
    expect(pickLocale<ThreeLang>('ja,en;q=0.5', supported, 'en')).toBe('ja');
  });
});

describe('acceptLanguageRedirect (default-configured EdgeHandler)', () => {
  const makeReq = (path: string, headers: Record<string, string> = {}) =>
    new Request(`https://nicolasbracigliano.com${path}`, { headers });

  it('redirects / to /es/ when Spanish is preferred', async () => {
    const res = await acceptLanguageRedirect(makeReq('/', { 'accept-language': 'es-AR,es;q=0.9' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/es\/$/);
    expect(res.headers.get('Vary')).toBe('Accept-Language');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('redirects / to /en/ when English is preferred', async () => {
    const res = await acceptLanguageRedirect(makeReq('/', { 'accept-language': 'en-AU' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/en\/$/);
  });

  it('falls back to default when no Accept-Language is provided', async () => {
    const res = await acceptLanguageRedirect(makeReq('/'));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/en\/$/);
  });

  it('404s for any non-root path', async () => {
    const res = await acceptLanguageRedirect(makeReq('/anything', { 'accept-language': 'es' }));
    expect(res.status).toBe(404);
  });
});

describe('createAcceptLanguageRedirect (factory)', () => {
  it('honors a custom status code', async () => {
    const handler = createAcceptLanguageRedirect({
      supported: ['en', 'es'] as const,
      defaultLocale: 'en',
      status: 308,
    });
    const res = await handler(new Request('https://example.com/'));
    expect(res.status).toBe(308);
  });

  it('honors a custom root path', async () => {
    const handler = createAcceptLanguageRedirect({
      supported: ['en', 'es'] as const,
      defaultLocale: 'en',
      rootPath: '/welcome',
    });
    const root = await handler(new Request('https://example.com/welcome'));
    expect(root.status).toBe(302);
    const notRoot = await handler(new Request('https://example.com/'));
    expect(notRoot.status).toBe(404);
  });

  it('supports more than two locales', async () => {
    const handler = createAcceptLanguageRedirect({
      supported: ['en', 'es', 'ja'] as const,
      defaultLocale: 'en',
    });
    const res = await handler(
      new Request('https://example.com/', { headers: { 'accept-language': 'ja,en;q=0.5' } }),
    );
    expect(res.headers.get('Location')).toMatch(/\/ja\/$/);
  });
});
