import { describe, expect, it } from 'vitest';
import { SECURITY_TXT_PATH, securityTxtResponse } from '../../src/lib/security-txt';

// `securityTxtResponse` is the platform-neutral core that turns the
// repo's `public/.well-known/security.txt` content into a served
// response. It exists because Cloudflare Workers Static Assets won't
// serve dot-prefixed directories like `.well-known/`, so `src/worker.ts`
// serves the file itself. These tests pin the response contract; the
// adapter wiring is covered in `worker.test.ts`.

describe('securityTxtResponse', () => {
  it('serves the body with HTTP 200', async () => {
    const res = securityTxtResponse('Contact: mailto:security@example.com\n');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Contact: mailto:security@example.com\n');
  });

  it('uses the RFC 9116 media type (text/plain; charset=utf-8)', () => {
    const res = securityTxtResponse('Contact: mailto:security@example.com\n');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });

  it('is cacheable (security.txt changes rarely)', () => {
    const res = securityTxtResponse('Contact: mailto:security@example.com\n');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });
});

describe('SECURITY_TXT_PATH', () => {
  it('is the RFC 9116 well-known location', () => {
    expect(SECURITY_TXT_PATH).toBe('/.well-known/security.txt');
  });
});
