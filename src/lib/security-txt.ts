// security.txt serving — platform-neutral.
//
// The canonical file lives at `public/.well-known/security.txt` (a
// rotation workflow keeps its `Expires` fresh and CI's
// `security-txt-expires` guard validates it). But Cloudflare Workers
// Static Assets does NOT serve dot-prefixed directories, so a request
// for `/.well-known/security.txt` 404s at the asset layer. `src/worker.ts`
// works around this by serving the file itself: it imports the content
// at build time (a wrangler `Text` module rule) and returns it via
// `securityTxtResponse`. Keeping the path + response shape here means
// the smoke script and the worker share one definition.

/** RFC 9116 well-known location for security.txt. */
export const SECURITY_TXT_PATH = '/.well-known/security.txt';

/** Build the served response for security.txt from its file content. */
export function securityTxtResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      // RFC 9116 §3: served as text/plain with UTF-8.
      'Content-Type': 'text/plain; charset=utf-8',
      // Contents change only on rotation (~yearly); an hour of edge/
      // browser caching is safe and saves Worker invocations.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
