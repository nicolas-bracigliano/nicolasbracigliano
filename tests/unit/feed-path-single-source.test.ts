// `src/lib/feeds.ts` claims to be the single source for feed metadata, and
// `tests/unit/feeds.test.ts` pins the half it can see: FEEDS.path against the
// route file that builds it, FEEDS.title against the two feed routes. Neither
// check can see a page that never imports the module.
//
// That is the gap this file closes. Rename `rss-en.xml.ts` and update
// FEEDS.en.path in step and feeds.test.ts stays green — both sides moved
// together — while any href typed out by hand in a page keeps pointing at the
// old URL. Nothing renders the two side by side, so the only symptom is a
// visible link that 404s.
//
// Scope is deliberately code only (`.astro`, `.ts`, `.tsx`). Markdown under
// `src/content/` is author copy: a note is allowed to mention a feed URL in
// prose, and a test that forbade it would be a style gate, not a correctness
// one (CLAUDE.md, ADR 0011).
//
// `public/_headers` is out of scope too — it is served verbatim by the host
// and cannot import TypeScript, so its feed globs are a second source by
// necessity rather than by drift.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FEEDS } from '../../src/lib/feeds';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const SRC = resolve(ROOT, 'src');

/** The one file allowed to spell a feed path out. */
const SOURCE_OF_TRUTH = 'lib/feeds.ts';

const CODE = /\.(astro|tsx?)$/;

// Root-absolute, feed-shaped, `.xml`. The leading slash is what keeps the
// author's `label: 'rss.xml'` copy on the home pages out of scope — that is a
// display string, not a URL, and changing it is the writer's call.
const FEED_SHAPED_PATH = /\/[a-z0-9-]*(?:rss|feed|atom)[a-z0-9-]*\.xml/i;

async function codeFiles(): Promise<string[]> {
  const entries = await readdir(SRC, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && CODE.test(e.name))
    .map((e) => join(e.parentPath, e.name).slice(SRC.length + 1))
    .filter((rel) => rel !== SOURCE_OF_TRUTH)
    .sort();
}

async function offenders(match: (source: string) => boolean): Promise<string[]> {
  const files = await codeFiles();
  const hits = await Promise.all(
    files.map(async (rel) => (match(await readFile(resolve(SRC, rel), 'utf-8')) ? rel : null)),
  );
  return hits.filter((rel): rel is string => rel !== null);
}

describe('feed paths have a single source', () => {
  it('finds the files to scan at all', () => {
    // Guards the walk itself: a bad glob or a moved `src/` would make every
    // assertion below vacuously true.
    return expect(codeFiles()).resolves.toContain('pages/en/index.astro');
  });

  it('has no feed-shaped URL literal outside @lib/feeds', async () => {
    const found = await offenders((source) => FEED_SHAPED_PATH.test(source));
    expect(found, `import FEEDS from '@lib/feeds' instead of inlining the path`).toEqual([]);
  });

  it('has no copy of a current FEEDS path outside @lib/feeds', async () => {
    // Catches the rename case the shape regex above would miss: if a feed
    // moves to a URL that does not read as a feed (`/notes-en.xml`), a stale
    // `/rss-en.xml` left behind in a page is still the same silent 404.
    const paths = Object.values(FEEDS).map((f) => f.path);
    const found = await offenders((source) => paths.some((p) => source.includes(p)));
    expect(found, `import FEEDS from '@lib/feeds' instead of inlining the path`).toEqual([]);
  });
});
