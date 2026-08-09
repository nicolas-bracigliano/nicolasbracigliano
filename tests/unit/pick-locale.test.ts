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

describe('pickLocale — q=0 is a rejection, not a preference (RFC 9110 §12.4.2)', () => {
  it('treats a lone q=0 as "not acceptable"', () => {
    expect(pickLocale('es;q=0', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
    // 0, 0.0 and 0.000 are the same qvalue — the ABNF allows up to 3 decimals.
    expect(pickLocale('es;q=0.0', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
    expect(pickLocale('es;q=0.000', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('falls back to the default when every range is rejected', () => {
    // Nothing is acceptable, but the signature must still return a locale —
    // the root redirect has no 406 story. Default is the least-bad answer.
    expect(pickLocale('es;q=0,en;q=0', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('skips a rejected range in favour of a later accepted one', () => {
    // Worked before the q=0 fix by accident (the q-descending sort put `en`
    // first); kept so a future re-sort can't silently take it away.
    expect(pickLocale('es;q=0,en', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('rejects only the range that carries q=0', () => {
    expect(pickLocale('fr;q=0,es;q=0.5', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
  });
});

describe('pickLocale — the `*` wildcard', () => {
  it('resolves a bare wildcard to the default locale', () => {
    expect(pickLocale('*', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('lets an explicit tag beat a higher-weighted wildcard', () => {
    // `*` means "anything", which is a weaker statement than naming a tag,
    // so it is a fallback regardless of weight.
    expect(pickLocale('*;q=1.0,es;q=0.5', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
  });

  it('uses the wildcard to route around an explicitly rejected default', () => {
    // "not English, but anything else is fine" — the only reading that leaves
    // `*` doing real work, and the one case where it changes the answer.
    expect(pickLocale('en;q=0,*', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
  });

  it('does not offer a wildcard-covered locale the client already rejected', () => {
    expect(pickLocale('es;q=0,*', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('treats `*;q=0` as "nothing else is acceptable" and still returns the default', () => {
    expect(pickLocale('*;q=0', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
    expect(pickLocale('fr,*;q=0', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });
});

describe('pickLocale — malformed and unusual headers', () => {
  it('tolerates whitespace and casing around the weight parameter', () => {
    // RFC 9110 allows OWS around `;` and the parameter name is case-insensitive.
    expect(pickLocale('fr;q=1.0, es ; q=0.8', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
    expect(pickLocale('fr;q=1.0,es;Q=0.8', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
    expect(pickLocale('es ; q=0', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('en');
  });

  it('ignores an unparseable weight rather than the range that carries it', () => {
    // A garbled weight is a malformed parameter, so the range keeps the
    // default weight of 1. Only a well-formed q=0 is a rejection.
    expect(pickLocale('es;q=banana', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
    expect(pickLocale('es;q=-1,en;q=0.5', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
    expect(pickLocale('es;q=7,en;q=0.5', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
  });

  it('skips empty ranges from stray commas', () => {
    expect(pickLocale(',,es;q=0.9,', SUPPORTED_LOCALES, DEFAULT_LOCALE)).toBe('es');
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

  it('redirects / to /en/ when Spanish is explicitly rejected', async () => {
    const res = await acceptLanguageRedirect(makeReq('/', { 'accept-language': 'es;q=0' }));
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
