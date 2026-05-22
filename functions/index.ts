// Cloudflare Pages adapter. The redirect logic lives in
// src/lib/pick-locale.ts as a platform-neutral `EdgeHandler` — to port
// this to Vercel Edge, Netlify Edge, Deno Deploy, Bun, or a plain Worker,
// write a similar adapter against the same `acceptLanguageRedirect` export.

import { acceptLanguageRedirect } from '../src/lib/pick-locale';

type PagesFunction = (context: { request: Request }) => Promise<Response> | Response;

export const onRequest: PagesFunction = ({ request }) => acceptLanguageRedirect(request);
