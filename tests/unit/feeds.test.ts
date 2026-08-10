// `@lib/feeds` is the single source for RSS metadata, shared by the two
// feed routes and BaseLayout's autodiscovery links. These tests pin the
// coupling that has no other guard: the `<link title>` a reader displays
// must equal the feed's own `<title>`, and the advertised href must be the
// path the feed is actually built at.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FEEDS, RSS_MIME } from '../../src/lib/feeds';
import { SUPPORTED_LOCALES } from '../../src/lib/pick-locale';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf-8');

describe('FEEDS', () => {
  it('covers every supported locale', () => {
    // Adding a locale without a feed would silently ship a page whose
    // autodiscovery link points at `undefined`.
    for (const locale of SUPPORTED_LOCALES) {
      expect(FEEDS[locale], `no feed metadata for ${locale}`).toBeDefined();
    }
    expect(Object.keys(FEEDS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('advertises a path that matches the route file that builds it', () => {
    // `/rss-en.xml` must be produced by `src/pages/rss-en.xml.ts`. Astro
    // derives the URL from the filename, so the mapping is positional and
    // easy to break by renaming one side only.
    for (const locale of SUPPORTED_LOCALES) {
      const path = FEEDS[locale].path;
      expect(path.startsWith('/'), `${locale} feed path must be root-absolute`).toBe(true);
      expect(() => read(`../../src/pages${path}.ts`)).not.toThrow();
    }
  });

  it('is consumed by the feed routes rather than re-declaring the strings', () => {
    // The whole point of the module. If a route inlines its own title
    // again, the autodiscovery link and the feed disagree with no symptom.
    for (const locale of SUPPORTED_LOCALES) {
      const source = read(`../../src/pages${FEEDS[locale].path}.ts`);
      // Match the import STATEMENT, not the bare string: the file's header
      // comment mentions `@lib/feeds` in prose, so a `toContain` check passes
      // even with the import deleted.
      expect(source, `${locale} feed should import FEEDS`).toMatch(
        /^import\s+\{[^}]*\bFEEDS\b[^}]*\}\s+from\s+'@lib\/feeds';$/m,
      );
      expect(source, `${locale} feed should not inline its title`).not.toContain(
        `'${FEEDS[locale].title}'`,
      );
    }
  });

  it('gives each locale a distinct title, path and language', () => {
    const titles = SUPPORTED_LOCALES.map((l) => FEEDS[l].title);
    const paths = SUPPORTED_LOCALES.map((l) => FEEDS[l].path);
    const languages = SUPPORTED_LOCALES.map((l) => FEEDS[l].language);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(languages).size).toBe(languages.length);
  });

  it('uses the RSS mime type browsers expect for autodiscovery', () => {
    expect(RSS_MIME).toBe('application/rss+xml');
  });
});
