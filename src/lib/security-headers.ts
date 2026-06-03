// Security headers for Worker-generated responses — platform-neutral.
//
// `public/_headers` applies a `/*` block to every Static-Asset response,
// but Workers Static Assets only runs that post-processing on responses
// it serves. Responses the Worker generates itself (the `/` redirect in
// `pick-locale.ts`, the `/.well-known/security.txt` body) bypass it. This
// reapplies the same posture so a security scan of those endpoints sees
// the full header set, not a subset.
//
// The values here intentionally duplicate the `/*` block in
// `public/_headers`. Generating one from the other was considered, but a
// build-time generator plus a staleness check is more machinery than a
// short header block warrants; instead `tests/unit/security-headers.test.ts`
// parses `_headers` and fails if any value here drifts from it.
//
// Strict-Transport-Security is deliberately omitted: HSTS is owned by the
// Cloudflare zone setting (SSL/TLS -> Edge Certificates), which applies to
// every response — worker- and asset-served alike. Declaring it here would
// be a no-op, so the Worker stays out of it and the zone stays the single
// owner.
export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

/** Return a copy of `response` with the site's security headers applied.
 *  Response-specific headers (Content-Type, Location, Cache-Control,
 *  Vary) are preserved; status and body are unchanged. */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
