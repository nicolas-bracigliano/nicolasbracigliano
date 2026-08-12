// Per-locale RSS feed metadata. Single source of truth, consumed by:
//   - `src/pages/rss-en.xml.ts` / `rss-es.xml.ts` — the feed's own <title>,
//     <description> and <language>
//   - `src/layouts/BaseLayout.astro` — the `<link rel="alternate">`
//     autodiscovery tags in <head>
//
// Why this file exists rather than inline strings in the two route files:
// the autodiscovery `title` attribute is what a feed reader shows in its
// subscription list, and it should match the feed's own <title> exactly.
// Two copies of that string in three files is a drift waiting to happen —
// and a silent one, because nothing renders the two side by side.
//
// Astro-free on purpose (same rationale as `routes.ts` and `now-items.ts`):
// no `astro:content` import, so it stays unit-testable in plain vitest.
//
// Copy is author-written and localised per feed — ES is a parallel
// composition, not a translation. Do not "fix" one to mirror the other.

import type { Locale } from './routes';

export interface FeedMeta {
  /** Site-root-absolute path the feed is served from. */
  readonly path: string;
  /** Feed <title>, and the `title` attribute on the autodiscovery link. */
  readonly title: string;
  /** Feed <description>. */
  readonly description: string;
  /** RFC 5646 tag emitted as RSS <language>. `en-au` is deliberate —
   *  the author writes from Melbourne. */
  readonly language: string;
}

export const FEEDS: Readonly<Record<Locale, FeedMeta>> = {
  en: {
    path: '/rss-en.xml',
    title: 'Nicolas Bracigliano — notes & pieces (EN)',
    description: 'Notes and pieces from a software engineer in Melbourne.',
    language: 'en-au',
  },
  es: {
    path: '/rss-es.xml',
    title: 'Nicolas Bracigliano — notas y ensayos (ES)',
    description: 'Notas y ensayos de un ingeniero de software en Melbourne.',
    language: 'es',
  },
};

/** The MIME type browsers and readers expect on an RSS autodiscovery link. */
export const RSS_MIME = 'application/rss+xml';
