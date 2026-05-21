import { describe, expect, it } from 'vitest';
import { onRequest } from '../../functions/index';

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://nicolasbracigliano.com/', { headers });
}

describe('Pages Function: Accept-Language redirect at /', () => {
  it('redirects to /es/ when Spanish is preferred', async () => {
    const res = await onRequest({
      request: makeRequest({ 'accept-language': 'es-AR,es;q=0.9,en;q=0.7' }),
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/es\/$/);
    expect(res.headers.get('Vary')).toBe('Accept-Language');
  });

  it('redirects to /en/ when English is preferred', async () => {
    const res = await onRequest({ request: makeRequest({ 'accept-language': 'en-AU,en;q=0.9' }) });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/en\/$/);
  });

  it('falls back to default locale (en) when no header is present', async () => {
    const res = await onRequest({ request: makeRequest({}) });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/en\/$/);
  });

  it('falls back to default locale on unknown languages', async () => {
    const res = await onRequest({ request: makeRequest({ 'accept-language': 'fr-FR,fr;q=0.9' }) });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/en\/$/);
  });

  it('respects q-value ordering', async () => {
    const res = await onRequest({
      request: makeRequest({ 'accept-language': 'fr;q=1.0,es;q=0.8,en;q=0.5' }),
    });
    expect(res.status).toBe(302);
    // fr unsupported → fall through to es (higher q than en)
    expect(res.headers.get('Location')).toMatch(/\/es\/$/);
  });
});
