import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const notes = await getCollection(
    'notes',
    (e) => e.data.lang === 'en' && e.data.status === 'published',
  );
  const essays = await getCollection(
    'essays',
    (e) => e.data.lang === 'en' && e.data.status === 'published',
  );
  const items = [...notes, ...essays]
    .sort((a, b) => +b.data.date - +a.data.date)
    .map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.lede ?? '',
      link: e.collection === 'notes' ? `/en/notes/${e.data.slug}/` : `/en/essays/${e.data.slug}/`,
    }));

  return rss({
    title: 'Nicolas Bracigliano — notes & essays (EN)',
    description: 'Notes and essays from a senior software engineer in Melbourne.',
    site: context.site ?? 'https://nicolasbracigliano.com',
    items,
    customData: '<language>en-au</language>',
  });
}
