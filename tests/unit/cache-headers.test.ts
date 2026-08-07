// Cache-policy contract for `public/_headers`.
//
// Separate from `security-headers.test.ts` (which pins the `/*` security
// posture and its no-drift relationship with `src/lib/security-headers.ts`)
// because caching and security are different invariants with different
// failure modes: a security drift weakens the site, a cache drift either
// costs a round-trip or — worse — serves a stale asset for a year.
//
// `immutable` is a one-year promise that a URL's bytes will never change.
// That is only true for content-hashed filenames, which is why the guard
// below asserts the *set* of immutable blocks rather than just their values:
// adding `immutable` to a path whose filenames are stable (`/og/*.png`, or
// the `/*` catch-all) would pin stale content in every reader's browser
// cache with no way to bust it. Failing here is the prompt to check whether
// the new path is really hashed.

import { describe, expect, it } from 'vitest';
import {
  headerBlockPaths,
  headerValue,
  parseHeadersBlock,
  readHeadersFile,
} from './helpers/headers';

const IMMUTABLE = 'public, max-age=31536000, immutable';

/** The blocks currently allowed to declare `immutable`.
 *
 *  - `/_astro/*` — genuinely safe: Vite emits `name.<hash>.{js,css}`, so a
 *    byte change always produces a new URL.
 *  - `/fonts/*`  — grandfathered, and NOT hash-backed. The filenames are
 *    fixed (`newsreader-variable.woff2`) and referenced without a version
 *    query from both `src/styles/fonts.css` and the `<link rel="preload">`
 *    pair in `src/layouts/BaseLayout.astro`, while
 *    `scripts/subset-fonts.mjs` fetches `:vf@latest` from jsdelivr and
 *    overwrites in place. So re-running the subset script and deploying
 *    leaves returning visitors on the old font for up to a year with no way
 *    to bust it. Tolerable (a stale subset still renders, and the script is
 *    run rarely) but it is a real hole, not a hashed path. If it needs
 *    fixing, a `?v=N` has to land in all four references at once — the
 *    preload href must byte-match the CSS `url()` or the preload silently
 *    stops being used. */
const IMMUTABLE_BLOCKS = ['/_astro/*', '/fonts/*'];

describe('public/_headers cache policy', () => {
  const raw = readHeadersFile();

  it('caches content-hashed /_astro assets immutably', () => {
    // The regression this pins: without the block, the asset layer default
    // (`public, max-age=0, must-revalidate`) applies and every repeat visit
    // revalidates every script and stylesheet.
    expect(headerValue(parseHeadersBlock(raw, '/_astro/*'), 'Cache-Control')).toBe(IMMUTABLE);
  });

  it('caches the subset fonts immutably', () => {
    expect(headerValue(parseHeadersBlock(raw, '/fonts/*'), 'Cache-Control')).toBe(IMMUTABLE);
  });

  it('does not promise immutability for any non-hashed path', () => {
    const immutablePaths = headerBlockPaths(raw).filter((p) =>
      (headerValue(parseHeadersBlock(raw, p), 'Cache-Control') ?? '').includes('immutable'),
    );
    expect(immutablePaths.sort()).toEqual([...IMMUTABLE_BLOCKS].sort());
  });

  it('keeps OG cards on a short TTL (stable filenames, content can change)', () => {
    // An OG card's URL is derived from the entry slug, so editing a title
    // rewrites the bytes behind an unchanged URL. Must stay bustable.
    const og = headerValue(parseHeadersBlock(raw, '/og/*.png'), 'Cache-Control') ?? '';
    expect(og).not.toContain('immutable');
    expect(og).toContain('max-age=86400');
  });
});
