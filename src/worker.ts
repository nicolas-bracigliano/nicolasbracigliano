// Cloudflare Worker entry point. Hosts the Astro build via the
// Workers Static Assets binding (configured in `wrangler.toml`)
// and handles the one dynamic route on the site: the root `/`
// does an Accept-Language redirect to `/en/` or `/es/`.
//
// The redirect logic lives in `src/lib/pick-locale.ts` as a
// platform-neutral `EdgeHandler` — same export covered by
// `tests/unit/pick-locale.test.ts`. This file is essentially a
// 6-line adapter between the Workers entry shape (default
// export with `fetch`) and that platform-neutral handler.
//
// Everything that isn't `/` falls through to `env.ASSETS.fetch`,
// which serves the matching file from `dist/` or — if no file
// matches — returns `dist/404.html` with HTTP 404 thanks to
// `not_found_handling = "404-page"` in `wrangler.toml`.

import { acceptLanguageRedirect } from './lib/pick-locale';

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
    if (url.pathname === '/' || url.pathname === '') {
      return acceptLanguageRedirect(request);
    }
    return env.ASSETS.fetch(request);
  },
};
