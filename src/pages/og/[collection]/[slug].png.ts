import type { APIRoute, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ogSlugFor } from '@lib/i18n';

// Satori + Resvg integration. Requires `public/fonts/og-newsreader.ttf` —
// run `pnpm run subset-fonts` to produce it. Until then, the endpoint
// falls back to a solid-colour 1200×630 PNG via Sharp so the build never
// breaks on a fresh clone.

const FONT_PATH = resolve(process.cwd(), 'public/fonts/og-newsreader.ttf');

export async function getStaticPaths() {
  const grouped = await Promise.all(
    (['notes', 'works', 'essays'] as const).map(async (name) =>
      (await getCollection(name)).map((entry) => ({ collection: name, entry })),
    ),
  );
  const allOgs = grouped.flat().filter(({ entry }) => entry.data.status === 'published');

  return allOgs.map(({ collection, entry }) => ({
    params: { collection, slug: ogSlugFor(entry) },
    props: { entry, collection },
  }));
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) => {
  const { entry, collection } = props;
  const kind = collection === 'notes' ? 'note' : collection === 'works' ? 'work' : 'essay';

  if (existsSync(FONT_PATH)) {
    try {
      const [{ default: satori }, { Resvg }, { OgCard }] = await Promise.all([
        import('satori'),
        import('@resvg/resvg-js'),
        import('@lib/og-template'),
      ]);
      const fontData = await readFile(FONT_PATH);
      // Satori's TS signature requires `ReactNode` from React, but
      // its runtime duck-types JSX-shaped objects (any `{ type,
      // props }`). `OgCard` returns our own `SatoriElement` for
      // exactly this purpose, so the cast bridges declared-vs-
      // runtime contract at a single boundary. See
      // `src/lib/og-template.tsx` for the matching interface.
      const element = OgCard({
        title: entry.data.title,
        locale: entry.data.lang,
        kind,
        ...(entry.data.lede && { lede: entry.data.lede }),
      }) as unknown as Parameters<typeof satori>[0];
      const svg = await satori(element, {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Newsreader', data: fontData, weight: 500, style: 'normal' }],
      });
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
      return new Response(new Uint8Array(png), {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
      });
    } catch (err) {
      console.error('OG generation failed, falling back to solid PNG:', err);
    }
  }

  const sharp = (await import('sharp')).default;
  const png = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 246, g: 244, b: 239, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  });
};
