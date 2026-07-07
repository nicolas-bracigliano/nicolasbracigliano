// Static JSON index for the Command-K palette. Prerendered at build from
// the content collections via buildCmdkIndex, served same-origin, and
// fetched once by src/scripts/cmdk.ts on first open.
import type { APIRoute } from 'astro';
import { buildCmdkIndex } from '@lib/cmdk-index';

export const GET: APIRoute = async () => {
  const index = await buildCmdkIndex('es');
  return new Response(JSON.stringify(index), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
