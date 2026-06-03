import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS, withSecurityHeaders } from '../../src/lib/security-headers';

// Worker-generated responses (the `/` redirect, `/.well-known/security.txt`)
// bypass the Static Assets layer, so the `/*` rules in `public/_headers`
// never reach them. `withSecurityHeaders` reapplies that posture in the
// Worker. These tests pin the behaviour and — crucially — guard against
// the worker set drifting from `public/_headers`.

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

  it('omits Strict-Transport-Security (the Cloudflare zone manages it)', () => {
    const res = withSecurityHeaders(new Response('hi'));
    expect(res.headers.has('Strict-Transport-Security')).toBe(false);
  });
});

describe('SECURITY_HEADERS mirrors public/_headers', () => {
  // Anti-drift guard: the worker set must equal the asset `/*` block,
  // minus HSTS (zone-managed). Editing one without the other fails here.
  it('matches the /* block (excluding Strict-Transport-Security)', () => {
    const raw = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf-8');
    const lines = raw.split('\n');
    const start = lines.findIndex((l) => l.trim() === '/*');
    const block: Record<string, string> = {};
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined || !/^\s/.test(line) || line.trim() === '') break;
      const idx = line.indexOf(':');
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key !== 'Strict-Transport-Security') block[key] = value;
    }
    expect(SECURITY_HEADERS).toEqual(block);
  });
});
