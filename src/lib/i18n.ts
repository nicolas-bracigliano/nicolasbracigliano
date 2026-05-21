// Astro-runtime layer: depends on astro:content. Pure routing primitives
// live in routes.ts so they remain unit-testable in plain vitest.
import { getCollection, type CollectionEntry } from 'astro:content';
import { ROUTES, otherLocale } from './routes';

export * from './routes';

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

export function entryRouteFor(entry: AnyEntry): string {
  const { collection } = entry;
  const { lang, slug } = entry.data;
  if (collection === 'pages') {
    return isPageSlug(slug) ? ROUTES[slug][lang] : `/${lang}/`;
  }
  return `${ROUTES[collection][lang]}${slug}/`;
}

export async function getSibling(entry: AnyEntry): Promise<AnyEntry | null> {
  const target = otherLocale(entry.data.lang);
  const all = await getCollection(entry.collection);
  const sibling = all.find(
    (e) =>
      e.data.translationKey === entry.data.translationKey &&
      e.data.lang === target &&
      e.data.status === 'published',
  );
  return (sibling ?? null) as AnyEntry | null;
}
