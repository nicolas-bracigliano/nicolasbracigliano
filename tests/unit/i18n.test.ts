// Unit tests for the Astro-coupled i18n helpers. We avoid mocking
// `astro:content` by:
//  - testing `entryRouteFor` against structurally-shaped fixtures (it only
//    reads `collection`, `data.lang`, `data.slug`).
//  - testing `findSiblingIn` (the pure version of `getSibling` that takes a
//    pre-loaded entry list).
//
// The thin `getSibling` wrapper that calls `getCollection()` is exercised
// in the e2e suite — there's nothing to unit-test there.

import { describe, expect, it, vi } from 'vitest';

// `i18n.ts` imports `getCollection` from `astro:content`, a virtual module
// that only exists inside Astro's bundler. Stub it for unit tests — we only
// exercise the pure exports (`entryRouteFor`, `findSiblingIn`).
vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => []),
}));

import type { AnyEntry } from '../../src/lib/i18n';
import { entryRouteFor, findSiblingIn } from '../../src/lib/i18n';

type Lang = 'en' | 'es';
type Status = 'draft' | 'published' | 'retired';

function note(opts: {
  lang: Lang;
  slug: string;
  translationKey: string;
  status?: Status;
}): AnyEntry {
  return {
    id: `${opts.lang}/${opts.slug}`,
    collection: 'notes',
    data: {
      title: opts.slug,
      slug: opts.slug,
      lang: opts.lang,
      translationKey: opts.translationKey,
      date: new Date('2026-05-21'),
      status: opts.status ?? 'published',
      tags: [],
      glyph: 'none',
    },
  } as unknown as AnyEntry;
}

function work(opts: { lang: Lang; slug: string; translationKey: string }): AnyEntry {
  return {
    id: `${opts.lang}/${opts.slug}`,
    collection: 'works',
    data: {
      title: opts.slug,
      slug: opts.slug,
      lang: opts.lang,
      translationKey: opts.translationKey,
      date: new Date('2026-05-21'),
      status: 'published',
      tags: [],
      specs: {},
    },
  } as unknown as AnyEntry;
}

function page(opts: { lang: Lang; slug: string }): AnyEntry {
  return {
    id: `${opts.lang}/${opts.slug}`,
    collection: 'pages',
    data: {
      title: opts.slug,
      slug: opts.slug,
      lang: opts.lang,
      translationKey: opts.slug,
      date: new Date('2026-05-21'),
      status: 'published',
      tags: [],
    },
  } as unknown as AnyEntry;
}

describe('entryRouteFor', () => {
  it('builds the per-collection route with localized segments', () => {
    expect(entryRouteFor(note({ lang: 'en', slug: 'hello', translationKey: 'k' }))).toBe(
      '/en/notes/hello/',
    );
    expect(entryRouteFor(note({ lang: 'es', slug: 'hola', translationKey: 'k' }))).toBe(
      '/es/notas/hola/',
    );
    expect(entryRouteFor(work({ lang: 'en', slug: 'this-site', translationKey: 'k' }))).toBe(
      '/en/works/this-site/',
    );
    expect(entryRouteFor(work({ lang: 'es', slug: 'este-sitio', translationKey: 'k' }))).toBe(
      '/es/obras/este-sitio/',
    );
  });

  it('maps pages-collection slugs to their canonical route map', () => {
    expect(entryRouteFor(page({ lang: 'en', slug: 'home' }))).toBe('/en/');
    expect(entryRouteFor(page({ lang: 'es', slug: 'home' }))).toBe('/es/');
    expect(entryRouteFor(page({ lang: 'en', slug: 'about' }))).toBe('/en/about/');
    expect(entryRouteFor(page({ lang: 'es', slug: 'about' }))).toBe('/es/sobre/');
    expect(entryRouteFor(page({ lang: 'en', slug: 'now' }))).toBe('/en/about/now/');
    expect(entryRouteFor(page({ lang: 'es', slug: 'now' }))).toBe('/es/sobre/ahora/');
    expect(entryRouteFor(page({ lang: 'en', slug: 'colophon' }))).toBe('/en/colophon/');
    expect(entryRouteFor(page({ lang: 'es', slug: 'colophon' }))).toBe('/es/colofón/');
  });

  it('falls back to /{lang}/ for unknown page slugs', () => {
    expect(entryRouteFor(page({ lang: 'en', slug: 'unknown' }))).toBe('/en/');
  });
});

describe('findSiblingIn', () => {
  const helloEn = note({ lang: 'en', slug: 'hello', translationKey: 'k1' });
  const holaEs = note({ lang: 'es', slug: 'hola', translationKey: 'k1' });
  const onlyEn = note({ lang: 'en', slug: 'orphan', translationKey: 'k2' });
  const draftEs = note({ lang: 'es', slug: 'borrador', translationKey: 'k1', status: 'draft' });

  it('returns the published sibling in the other locale', () => {
    expect(findSiblingIn(helloEn, [helloEn, holaEs])).toBe(holaEs);
    expect(findSiblingIn(holaEs, [helloEn, holaEs])).toBe(helloEn);
  });

  it('returns null when no sibling exists', () => {
    expect(findSiblingIn(onlyEn, [helloEn, holaEs, onlyEn])).toBe(null);
  });

  it('ignores drafts as siblings', () => {
    expect(findSiblingIn(helloEn, [helloEn, draftEs])).toBe(null);
  });

  it('only matches entries with the same translationKey', () => {
    expect(
      findSiblingIn(helloEn, [helloEn, note({ lang: 'es', slug: 'otro', translationKey: 'kX' })]),
    ).toBe(null);
  });
});
