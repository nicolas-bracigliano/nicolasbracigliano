// Astro-runtime layer: depends on `astro:content`. Pure routing primitives
// live in `./routes.ts` so they stay unit-testable in plain Vitest. Callers
// that only need routing should import from `./routes`; callers that need to
// resolve entries or siblings should import from here.
import { getCollection, type CollectionEntry } from 'astro:content';
import { ROUTES, otherLocale, type Locale } from './routes';

export type AnyEntry =
  | CollectionEntry<'notes'>
  | CollectionEntry<'works'>
  | CollectionEntry<'essays'>
  | CollectionEntry<'pages'>;

const PAGE_ROUTE_KEYS = ['home', 'about', 'now', 'colophon'] as const;
type PageSlug = (typeof PAGE_ROUTE_KEYS)[number];

function isPageSlug(slug: string): slug is PageSlug {
  return (PAGE_ROUTE_KEYS as readonly string[]).includes(slug);
}

export function entryRouteFor<E extends AnyEntry>(entry: E): string {
  const { collection } = entry;
  const { lang, slug } = entry.data;
  if (collection === 'pages') {
    return isPageSlug(slug) ? ROUTES[slug][lang] : `/${lang}/`;
  }
  return `${ROUTES[collection][lang]}${slug}/`;
}

/** Pure: find the published sibling of `entry` in a pre-loaded list of
 *  same-collection entries. No I/O, fully unit-testable. */
export function findSiblingIn<E extends AnyEntry>(entry: E, candidates: readonly E[]): E | null {
  const targetLang: Locale = otherLocale(entry.data.lang);
  const sibling = candidates.find(
    (e) =>
      e.data.translationKey === entry.data.translationKey &&
      e.data.lang === targetLang &&
      e.data.status === 'published',
  );
  return sibling ?? null;
}

/** Astro-coupled wrapper: load the whole collection from the Astro content
 *  store, then delegate to `findSiblingIn`. Generic so callers don't need to
 *  widen `CollectionEntry<'notes'>` etc. to `AnyEntry`. */
export async function getSibling<E extends AnyEntry>(entry: E): Promise<E | null> {
  const all = (await getCollection(entry.collection)) as readonly E[];
  return findSiblingIn(entry, all);
}
