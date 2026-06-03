// Cloudflare Worker entry point. Hosts the Astro build via the
// Workers Static Assets binding (configured in `wrangler.toml`)
// and handles the two paths the asset layer can't serve on its own:
//   - the root `/` does an Accept-Language redirect to `/en/` or `/es/`;
//   - `/.well-known/security.txt` is served from the bundled file,
//     because Workers Static Assets won't serve dot-prefixed dirs.
//
// The redirect logic lives in `src/lib/pick-locale.ts` and the
// security.txt response in `src/lib/security-txt.ts`, both as
// platform-neutral helpers covered by unit tests. This file is the
// thin adapter between the Workers entry shape (default export with
// `fetch`) and those helpers.
//
// Everything else falls through to `env.ASSETS.fetch`, which serves
// the matching file from `dist/` or — if no file matches — returns
// `dist/404.html` with HTTP 404 thanks to `not_found_handling =
// "404-page"` in `wrangler.toml`.

import { acceptLanguageRedirect } from './lib/pick-locale';
import { withSecurityHeaders } from './lib/security-headers';
import { SECURITY_TXT_PATH, securityTxtResponse } from './lib/security-txt';
// Bundled as a string via the wrangler `Text` rule in `wrangler.toml`
// (and the `raw-text` plugin in `vitest.config.ts`). See `security-txt.ts`.
import securityTxt from '../public/.well-known/security.txt';

interface Env {
  /** Static-asset binding from `[assets] binding = "ASSETS"` in
   *  `wrangler.toml`. Forwards the request to the served-from-
   *  `dist/` asset for the matching path, or to `404.html` if
   *  no asset matches. */
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Responses the Worker generates itself bypass the `_headers`
    // post-processing the asset layer applies, so wrap them in the
    // site's security headers. Asset responses (the fall-through
    // below) already get `_headers` and are returned untouched.
    if (url.pathname === '/' || url.pathname === '') {
      return withSecurityHeaders(await acceptLanguageRedirect(request));
    }
    if (url.pathname === SECURITY_TXT_PATH) {
      return withSecurityHeaders(securityTxtResponse(securityTxt));
    }
    return env.ASSETS.fetch(request);
  },
};
