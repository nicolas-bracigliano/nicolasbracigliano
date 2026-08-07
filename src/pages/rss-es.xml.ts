import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
// Title/description/language live in `@lib/feeds` so the autodiscovery
// `<link rel="alternate">` in BaseLayout can't drift from this feed's
// own <title>. See that file's header.
import { FEEDS } from '@lib/feeds';

export async function GET(context: APIContext) {
  const notes = await getCollection(
    'notes',
    (e) => e.data.lang === 'es' && e.data.status === 'published',
  );
  const pieces = await getCollection(
    'pieces',
    (e) => e.data.lang === 'es' && e.data.status === 'published',
  );
  const items = [...notes, ...pieces]
    .sort((a, b) => +b.data.date - +a.data.date)
    .map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.lede ?? '',
      link: e.collection === 'notes' ? `/es/notas/${e.data.slug}/` : `/es/ensayos/${e.data.slug}/`,
    }));

  return rss({
    title: FEEDS.es.title,
    description: FEEDS.es.description,
    site: context.site ?? 'https://nicolasbracigliano.com',
    items,
    customData: `<language>${FEEDS.es.language}</language>`,
  });
}
