// Astro-runtime layer: depends on astro:content. Pure routing primitives
// live in routes.ts so they remain unit-testable in plain vitest.
import { getCollection, type CollectionEntry } from 'astro:content';
import { ROUTES, otherLocale, type Locale } from './routes';

export * from './routes';

export type AnyEntry =
  | CollectionEntry<'notes'>
  | CollectionEntry<'works'>
  | CollectionEntry<'essays'>
  | CollectionEntry<'pages'>;

export function entryRouteFor(entry: AnyEntry): string {
  const { collection } = entry;
  const { lang, slug } = entry.data;
  if (collection === 'pages') {
    const map = {
      home: ROUTES.home,
      about: ROUTES.about,
      now: ROUTES.now,
      colophon: ROUTES.colophon,
    } as const;
    const pair = (map as Record<string, { en: string; es: string }>)[slug];
    return pair?.[lang] ?? `/${lang}/`;
  }
  return `${ROUTES[collection][lang]}${slug}/`;
}

export async function getSibling(entry: AnyEntry): Promise<AnyEntry | null> {
  const target = otherLocale(entry.data.lang as Locale);
  const all = await getCollection(entry.collection);
  const sibling = all.find(
    (e) =>
      e.data.translationKey === entry.data.translationKey &&
      e.data.lang === target &&
      e.data.status === 'published',
  );
  return (sibling ?? null) as AnyEntry | null;
}
