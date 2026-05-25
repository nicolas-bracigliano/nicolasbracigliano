// Astro-runtime layer: depends on `astro:content`. Pure routing primitives
// live in `./routes.ts` so they stay unit-testable in plain Vitest. Callers
// that only need routing should import from `./routes`; callers that need to
// resolve entries or siblings should import from here.
import { getCollection, type CollectionEntry } from 'astro:content';
import { ROUTES, otherLocale, PAGE_SLUGS, type Locale, type PageSlug } from './routes';

export type AnyEntry =
  | CollectionEntry<'notes'>
  | CollectionEntry<'works'>
  | CollectionEntry<'pieces'>
  | CollectionEntry<'pages'>;

// Runtime guard around `PAGE_SLUGS` (the source of truth in `routes.ts`).
// Shared with the discriminated `pages` Zod schema in
// `src/content.config.ts` — both files reach into the same constant so
// adding a new page slug is a one-line change in `routes.ts`.
function isPageSlug(slug: string): slug is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(slug);
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

/** Slug portion of the OG image route, e.g. "en-hello". Single source of
 *  truth — both the OG route's `getStaticPaths` and the layouts emit URLs
 *  derived from this. */
export function ogSlugFor(entry: AnyEntry): string {
  return `${entry.data.lang}-${entry.data.slug}`;
}

/** Full OG image URL ("/og/notes/en-hello.png") for use in `<meta og:image>`. */
export function ogImageUrlFor(entry: AnyEntry): string {
  return `/og/${entry.collection}/${ogSlugFor(entry)}.png`;
}
