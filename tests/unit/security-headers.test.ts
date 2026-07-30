import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS, withSecurityHeaders } from '../../src/lib/security-headers';
// `parseHeadersBlock` used to live here; it moved to the shared helper when
// `cache-headers.test.ts` needed the same parse.
import { parseHeadersBlock, readHeadersFile } from './helpers/headers';

// Worker-generated responses (the `/` redirect, `/.well-known/security.txt`)
// bypass the Static Assets layer, so the `/*` rules in `public/_headers`
// never reach them. `withSecurityHeaders` reapplies that posture in the
// Worker. These tests pin the behaviour and guard the worker set against
// drifting from `public/_headers`.

describe('withSecurityHeaders', () => {
  it('adds the security headers to a response', () => {
    const res = withSecurityHeaders(new Response('hi', { status: 200 }));
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('preserves status, body, and response-specific headers', async () => {
    const original = new Response('Contact: x\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    const res = withSecurityHeaders(original);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(await res.text()).toBe('Contact: x\n');
  });

  it('preserves a redirect (status + Location)', () => {
    const original = new Response(null, { status: 302, headers: { Location: 'https://x/en/' } });
    const res = withSecurityHeaders(original);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://x/en/');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('omits Strict-Transport-Security (the Cloudflare zone owns it)', () => {
    const res = withSecurityHeaders(new Response('hi'));
    expect(res.headers.has('Strict-Transport-Security')).toBe(false);
  });
});

describe('SECURITY_HEADERS stays consistent with public/_headers', () => {
  const assetBlock = parseHeadersBlock(readHeadersFile(), '/*');

  it('matches the _headers value for every header it declares (no drift)', () => {
    // Subset, not verbatim: `_headers` may carry headers we deliberately
    // don't replay on worker responses. What must never happen is a
    // *value* drift for a header the Worker does send.
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(assetBlock[name], `${name} drifted from public/_headers`).toBe(value);
    }
  });

  it('carries the core protections so they cannot be silently dropped', () => {
    for (const required of [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-Frame-Options',
    ]) {
      expect(SECURITY_HEADERS[required], `${required} missing from worker set`).toBeTruthy();
    }
  });

  it('does not declare Strict-Transport-Security (zone-owned)', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toBeUndefined();
  });
});
