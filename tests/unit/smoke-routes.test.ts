import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildTargets, type ContentEntry } from '../../scripts/smoke-routes.ts';
import { LEGACY_ROUTE_REDIRECTS, ROUTES } from '../../src/lib/routes';
import { SECURITY_TXT_PATH } from '../../src/lib/security-txt';

// `buildTargets` is the pure dispatch core of the CI smoke script
// (`scripts/smoke-routes.ts`). It composes the smoke-target list
// from `ROUTES` + a list of discovered content entries; the actual
// fs walk and HTTP fetches live in the script's CLI shell. These
// tests pin the dispatch contract that CI relies on.

function entry(
  collection: ContentEntry['collection'],
  slug: string,
  lang: ContentEntry['lang'],
  status = 'published',
): ContentEntry {
  return { collection, slug, lang, status };
}

describe('buildTargets', () => {
  it('starts with the worker-handled root redirect (302 expected)', () => {
    const targets = buildTargets([]);
    expect(targets[0]).toEqual({ path: '/', expected: 302 });
  });

  it('ends with the deliberate-404 sentinel (after sort)', () => {
    const targets = buildTargets([]);
    expect(targets[targets.length - 1]).toEqual({
      path: '/this-path-does-not-exist-12345/',
      expected: 404,
    });
  });

  it('includes the worker-served security.txt (expects 200)', () => {
    // Regression guard: security.txt is served by the Worker, not the
    // asset layer (which 404s dot-dirs). Without this target, a broken
    // serving path would pass CI silently.
    const t = buildTargets([]).find((x) => x.path === SECURITY_TXT_PATH);
    expect(t).toEqual({ path: '/.well-known/security.txt', expected: 200 });
  });

  it('includes every static route from ROUTES (en + es)', () => {
    const paths = new Set(buildTargets([]).map((t) => t.path));
    for (const pair of Object.values(ROUTES)) {
      expect(paths.has(pair.en), `missing static ${pair.en}`).toBe(true);
      expect(paths.has(pair.es), `missing static ${pair.es}`).toBe(true);
    }
  });

  it('every static-route target expects 200', () => {
    const targets = buildTargets([]);
    for (const pair of Object.values(ROUTES)) {
      const en = targets.find((t) => t.path === pair.en);
      const es = targets.find((t) => t.path === pair.es);
      expect(en?.expected).toBe(200);
      expect(es?.expected).toBe(200);
    }
  });

  it('checks every legacy Build route redirect and its destination', () => {
    const targets = buildTargets([]);
    for (const redirect of LEGACY_ROUTE_REDIRECTS) {
      expect(targets).toContainEqual({
        path: redirect.from,
        expected: 301,
        location: redirect.to,
      });
    }
  });

  it('keeps public/_redirects aligned with the post-deploy targets', () => {
    const redirectsPath = fileURLToPath(new URL('../../public/_redirects', import.meta.url));
    const rows = readFileSync(redirectsPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.split(/\s+/));

    for (const redirect of LEGACY_ROUTE_REDIRECTS) {
      // Cloudflare matches the encoded request pathname at the asset layer;
      // raw Unicode sources are ignored for `/es/colofón`.
      expect(rows).toContainEqual([encodeURI(redirect.from), redirect.to, '301']);
    }
  });

  it('builds content URLs as ROUTES[collection][lang] + slug + "/"', () => {
    const targets = buildTargets([
      entry('notes', 'hello', 'en'),
      entry('pieces', 'rings', 'en'),
      entry('works', 'this-site', 'en'),
    ]);
    const paths = new Set(targets.map((t) => t.path));
    expect(paths.has(`${ROUTES.notes.en}hello/`)).toBe(true);
    expect(paths.has(`${ROUTES.pieces.en}rings/`)).toBe(true);
    expect(paths.has(`${ROUTES.works.en}this-site/`)).toBe(true);
  });

  it('uses the ES route segment for ES entries', () => {
    const targets = buildTargets([entry('pieces', 'circulos', 'es')]);
    // ES pieces live at /es/ensayos/ per ADR 0010 — asymmetric routing.
    expect(targets.some((t) => t.path === '/es/ensayos/circulos/')).toBe(true);
  });

  it('filters out non-published entries', () => {
    const targets = buildTargets([
      entry('notes', 'draft-one', 'en', 'draft'),
      entry('notes', 'retired-one', 'en', 'retired'),
      entry('notes', 'live-one', 'en', 'published'),
    ]);
    const noteSlugs = targets
      .filter((t) => t.path.startsWith(ROUTES.notes.en))
      .filter((t) => t.path !== ROUTES.notes.en)
      .map((t) => t.path.replace(ROUTES.notes.en, '').replace(/\/$/, ''));
    expect(noteSlugs).toEqual(['live-one']);
  });

  it('content targets expect 200', () => {
    const targets = buildTargets([entry('works', 'milonga-slow', 'en')]);
    const t = targets.find((x) => x.path === `${ROUTES.works.en}milonga-slow/`);
    expect(t?.expected).toBe(200);
  });

  it('result is lexicographically sorted (excluding the trailing 404 sentinel)', () => {
    const targets = buildTargets([
      entry('works', 'zebra-work', 'en'),
      entry('notes', 'alpha-note', 'es'),
    ]);
    const inner = targets.slice(0, -1).map((t) => t.path);
    const sorted = [...inner].sort((a, b) => a.localeCompare(b));
    expect(inner).toEqual(sorted);
  });

  it('handles an empty entry list (all-static target list)', () => {
    const targets = buildTargets([]);
    // 7 named routes × 2 locales = 14 static + 6 legacy redirects
    // + 1 root + 1 security.txt + 1 sentinel = 23
    expect(targets.length).toBe(23);
  });
});
