import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS, withSecurityHeaders } from '../../src/lib/security-headers';

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

/** Parse a named block (e.g. `/*`) from a Cloudflare `_headers` file into a
 *  name->value map. Skips `#` comments and stops at the next path or a blank
 *  line — the same shape Cloudflare's own parser recognises. */
function parseHeadersBlock(raw: string, path: string): Record<string, string> {
  const lines = raw.split('\n');
  const start = lines.findIndex((l) => l.trim() === path);
  if (start === -1) throw new Error(`block ${path} not found in _headers`);
  const block: Record<string, string> = {};
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    // End of block: a non-indented line (next path) or a blank line.
    if (line === undefined || line.trim() === '' || !/^\s/.test(line)) break;
    if (line.trim().startsWith('#')) continue; // comment
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    block[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return block;
}

describe('SECURITY_HEADERS stays consistent with public/_headers', () => {
  const assetBlock = parseHeadersBlock(
    readFileSync(new URL('../../public/_headers', import.meta.url), 'utf-8'),
    '/*',
  );

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
