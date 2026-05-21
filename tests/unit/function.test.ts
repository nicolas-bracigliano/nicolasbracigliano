// Adapter smoke test. The redirect logic itself is covered by
// `pick-locale.test.ts` against the platform-neutral handler;
// this just confirms the Cloudflare Pages wiring forwards the request.

import { describe, expect, it } from 'vitest';
import { onRequest } from '../../functions/index';

describe('Cloudflare Pages adapter', () => {
  it('forwards request to acceptLanguageRedirect and returns a 302', async () => {
    const request = new Request('https://nicolasbracigliano.com/', {
      headers: { 'accept-language': 'es' },
    });
    const res = await onRequest({ request });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/es\/$/);
  });
});
