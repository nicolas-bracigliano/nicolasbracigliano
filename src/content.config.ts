import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const base = z.object({
  title: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  lang: z.enum(['en', 'es']),
  translationKey: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  status: z.enum(['draft', 'published', 'retired']).default('draft'),
  tags: z
    .array(z.string().transform((t) => t.toLowerCase()))
    .max(3)
    .default([]),
  lede: z.string().max(160).optional(),
});

// Use the full relative path (minus extension) as the entry id so that
// `pages/en/home.md` and `pages/es/home.md` don't collide on id "home".
const pathId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      glyph: z.enum(['garden', 'code', 'guitar', 'coffee', 'none']).default('none'),
      minutes: z.number().int().positive().optional(),
      aside: z.string().optional(),
      hero: image().optional(),
      ogOverride: image().optional(),
    }),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      repo: z.string().url().optional(),
      specs: z.record(z.string(), z.string()).default({}),
      hero: image().optional(),
      ogOverride: image().optional(),
    }),
});

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      series: z.string().optional(),
      hero: image().optional(),
      ogOverride: image().optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      hero: image().optional(),
      ogOverride: image().optional(),
    }),
});

export const collections = { notes, works, essays, pages };
