import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES } from '../../src/lib/routes';

// The CI smoke-test step in `.github/workflows/ci.yml` hard-codes
// the route paths it `curl`s against the deployed Worker. That list
// can't `import` from `src/lib/routes.ts` (it's a Bash step calling
// curl), so it duplicates the source of truth — a known maintenance
// dependency flagged in the `IMPORTANT` comment above ROUTES.
//
// This test enforces that contract: every published locale-path in
// ROUTES must appear as a `check <path>` line in the smoke step.
// Adding a route to ROUTES without updating the smoke list trips
// `pnpm verify:fast` instead of slipping past every code review.
//
// Routes intentionally excluded from the smoke list (no content yet,
// or the curl would 404 against a legitimately-missing page) live in
// the EXCLUDED set below. Add a comment when adding to this set.

const EXCLUDED: ReadonlySet<string> = new Set([
  // `/now` and `/ahora` are nested under /about/ and /sobre/ — the
  // parents already get smoked. Nesting drift would surface as a
  // failed redirect, not a missing route.
  '/en/about/now/',
  '/es/sobre/ahora/',
]);

const WORKFLOW_PATH = join(__dirname, '..', '..', '.github', 'workflows', 'ci.yml');
const CI_YML = readFileSync(WORKFLOW_PATH, 'utf-8');

function smokePaths(): Set<string> {
  // The smoke step in `ci.yml` lists each route as:
  //     check /en/notes/   200 || exit 1
  // Capture the path token between `check ` and the status code.
  //
  // Decode percent-encoded paths back to their unicode form so the
  // comparison with ROUTES works. `/es/colofón/` lives in ROUTES with
  // the literal `ó`, but ships in the smoke list as `/es/colof%C3%B3n/`
  // — curl sends literal UTF-8 bytes that Cloudflare 307-redirects to
  // the encoded form, breaking the immediate-status assertion. The
  // semantic check is "this route is in smoke," not "the byte
  // representation matches."
  const re = /^\s+check\s+(\/\S*?)\s+\d{3}\s*\|\|\s*exit\s+1\s*$/gm;
  const paths = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(CI_YML)) !== null) {
    if (m[1]) paths.add(decodeURIComponent(m[1]));
  }
  return paths;
}

describe('ROUTES ↔ ci.yml smoke list', () => {
  it('every published ROUTES path is smoked (or explicitly excluded)', () => {
    const smoked = smokePaths();
    const missing: string[] = [];
    for (const pair of Object.values(ROUTES)) {
      for (const path of [pair.en, pair.es]) {
        if (!EXCLUDED.has(path) && !smoked.has(path)) {
          missing.push(path);
        }
      }
    }
    expect(
      missing,
      "Add these to .github/workflows/ci.yml's smoke step, or add to EXCLUDED here",
    ).toEqual([]);
  });

  it('smoke list parses (drift-detection for the workflow regex)', () => {
    // Sanity: if someone reformats the smoke step and the regex
    // stops matching, this test fails fast instead of the
    // outer assertion silently asserting on an empty set.
    expect(smokePaths().size).toBeGreaterThan(0);
  });

  it('every EXCLUDED path is a real ROUTES path (no stale or typoed entries)', () => {
    // Lock the EXCLUDED set to actual routes — catches typos like
    // `/en/about/now` (missing trailing slash) and stale exclusions
    // for routes that have since been deleted. EXCLUDED is meant for
    // routes that exist but legitimately don't need smoking; it's not
    // a catch-all for "things we don't want to assert on."
    const allRoutePaths = new Set<string>();
    for (const pair of Object.values(ROUTES)) {
      allRoutePaths.add(pair.en);
      allRoutePaths.add(pair.es);
    }
    for (const excluded of EXCLUDED) {
      expect(allRoutePaths.has(excluded), `${excluded} is in EXCLUDED but not in ROUTES`).toBe(
        true,
      );
    }
  });
});
