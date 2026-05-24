import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 6 deprecates the `z` re-export from `astro:content`; import from
// `astro/zod` instead (Astro 6 ships zod v4).
import { z } from 'astro/zod';

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
      /** Manual override; if omitted, NoteEntry computes from `entry.body`. */
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
      repo: z.url().optional(),
      specs: z.record(z.string(), z.string()).default({}),
      /** Medium category — drives both the works-page filter buttons and
       *  the *default* WorkCard art vignette when `art` is unset. */
      kind: z.enum(['code', 'print', 'music', 'garden']).default('code'),
      /** Specific art vignette for this work. When unset, WorkArt falls
       *  back to the kind-default. Adding a new variant: extend this enum
       *  and add a matching block in `src/components/WorkArt.astro`. */
      art: z
        .enum(['terminal', 'font-specimen', 'tray', 'capo', 'knob', 'waveform', 'garden-plot'])
        .optional(),
      /** Work lifecycle — distinct from `status` (publish-state). Renders as
       *  a coloured dot + label in the WorkCard foot. */
      lifecycle: z.enum(['shipping', 'ongoing', 'draft', 'archived']).default('shipping'),
      /** Display number (e.g. "07") used in the card meta row. Keeps the
       *  catalog flavour — "№ 07" reads like an entry in a hand-kept ledger. */
      number: z.string().optional(),
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

// Numbered bench-tour items for the /about/now (en) and /about/ahora
// (es) page. Optional on the `pages` schema because only the now
// entry uses it; the home / about / colophon entries leave it
// unset. The shape mirrors `NowPageItem` in
// `src/components/NowItem.astro` — kept structurally identical
// so the inferred type drops straight into the existing rendering
// path without a translation layer.
const nowItemSchema = z.object({
  kind: z.enum(['code', 'guitar', 'garden', 'print', 'coffee', 'read']),
  where: z.string().min(1),
  title: z.string().min(1),
  prose: z.string().min(1),
  detail: z
    .array(
      z.object({
        dt: z.string().min(1),
        dd: z.string().min(1),
      }),
    )
    .min(1),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages', generateId: pathId }),
  schema: ({ image }) =>
    base.extend({
      hero: image().optional(),
      ogOverride: image().optional(),
      /** Numbered bench-tour items for the /now route. Only the
       *  now.md entries carry this; the other pages leave it unset. */
      items: z.array(nowItemSchema).optional(),
    }),
});

export const collections = { notes, works, essays, pages };
