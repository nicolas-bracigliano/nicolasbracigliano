import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const notes = await getCollection(
    'notes',
    (e) => e.data.lang === 'en' && e.data.status === 'published',
  );
  const pieces = await getCollection(
    'pieces',
    (e) => e.data.lang === 'en' && e.data.status === 'published',
  );
  const items = [...notes, ...pieces]
    .sort((a, b) => +b.data.date - +a.data.date)
    .map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.lede ?? '',
      link: e.collection === 'notes' ? `/en/notes/${e.data.slug}/` : `/en/pieces/${e.data.slug}/`,
    }));

  return rss({
    title: 'Nicolas Bracigliano — notes & pieces (EN)',
    description: 'Notes and pieces from a senior software engineer in Melbourne.',
    site: context.site ?? 'https://nicolasbracigliano.com',
    items,
    customData: '<language>en-au</language>',
  });
}
