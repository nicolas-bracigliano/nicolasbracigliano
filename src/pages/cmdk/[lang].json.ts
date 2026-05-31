// Static JSON index for the ⌘K command palette, one file per locale
// (/cmdk/en.json, /cmdk/es.json). Prerendered at build from the content
// collections via buildCmdkIndex. Served same-origin and fetched once (and
// cached) by src/scripts/cmdk.ts on first open — so the index lives in one
// small file instead of inlined into every page's HTML, and there's no
// inline <script> to reconcile with the strict `script-src 'self'` CSP.
import type { APIRoute, GetStaticPaths } from 'astro';
import { buildCmdkIndex } from '@lib/cmdk-index';
import type { Locale } from '@lib/routes';

export const getStaticPaths = (() => [
  { params: { lang: 'en' } },
  { params: { lang: 'es' } },
]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const lang: Locale = params.lang === 'es' ? 'es' : 'en';
  const index = await buildCmdkIndex(lang);
  return new Response(JSON.stringify(index), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
