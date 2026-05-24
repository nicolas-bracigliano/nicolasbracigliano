// Adapter smoke test for the Cloudflare Worker entry. The
// redirect logic itself is covered by `pick-locale.test.ts`
// against the platform-neutral handler; this asserts the
// adapter's wiring: `/` invokes the redirect, anything else
// delegates to `env.ASSETS.fetch`.

import { describe, expect, it, vi } from 'vitest';
import worker from '../../src/worker';

describe('Cloudflare Worker entry', () => {
  it('redirects / to the locale chosen from Accept-Language', async () => {
    const request = new Request('https://nicolasbracigliano.com/', {
      headers: { 'accept-language': 'es' },
    });
    const assetsFetch = vi.fn();
    const env = { ASSETS: { fetch: assetsFetch } };
    const res = await worker.fetch(request, env);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/\/es\/$/);
    // `/` must short-circuit before reaching the asset binding —
    // otherwise we'd double-fetch on every cold root visit.
    expect(assetsFetch).not.toHaveBeenCalled();
  });

  it('delegates non-root paths to env.ASSETS unchanged', async () => {
    const request = new Request('https://nicolasbracigliano.com/en/notes/hello/');
    const assetsFetch = vi.fn(async (req: Request) => {
      // Forward the same Request — Workers Static Assets needs
      // the original headers/method/URL to resolve the asset.
      expect(req.url).toBe('https://nicolasbracigliano.com/en/notes/hello/');
      return new Response('OK', { status: 200 });
    });
    const env = { ASSETS: { fetch: assetsFetch } };
    const res = await worker.fetch(request, env);
    expect(assetsFetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('treats an empty pathname as the root (defence-in-depth)', async () => {
    // Some clients/proxies send the path as empty rather than `/`.
    // The Worker treats both as the root redirect — matches the
    // behaviour of the platform-neutral handler.
    const request = new Request('https://nicolasbracigliano.com');
    const env = { ASSETS: { fetch: vi.fn() } };
    const res = await worker.fetch(request, env);
    expect(res.status).toBe(302);
  });
});
