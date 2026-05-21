import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// NOTE: Satori + Resvg integration is wired but requires font files at
// public/fonts/og-newsreader.ttf. Run `pnpm run subset-fonts` to produce them.
// If the font file is missing, the endpoint returns a 1200x630 solid-color
// PNG via Sharp as a fallback so the build never breaks.

const FONT_PATH = resolve(process.cwd(), 'public/fonts/og-newsreader.ttf');

export async function getStaticPaths() {
  const allOgs = [
    ...(await getCollection('notes')).map((e) => ({ collection: 'notes' as const, entry: e })),
    ...(await getCollection('works')).map((e) => ({ collection: 'works' as const, entry: e })),
    ...(await getCollection('essays')).map((e) => ({ collection: 'essays' as const, entry: e })),
  ].filter(({ entry }) => entry.data.status === 'published');

  return allOgs.map(({ collection, entry }) => ({
    params: { collection, slug: `${entry.data.lang}-${entry.data.slug}` },
    props: { entry, collection },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as { data: { title: string; lede?: string; lang: 'en' | 'es' } };
  const collection = props.collection as 'notes' | 'works' | 'essays';
  const kind = collection === 'notes' ? 'note' : collection === 'works' ? 'work' : 'essay';

  if (existsSync(FONT_PATH)) {
    try {
      const [{ default: satori }, { Resvg }, { OgCard }] = await Promise.all([
        import('satori'),
        import('@resvg/resvg-js'),
        import('@lib/og-template'),
      ]);
      const fontData = await readFile(FONT_PATH);
      const svg = await satori(
        OgCard({
          title: entry.data.title,
          lede: entry.data.lede,
          locale: entry.data.lang,
          kind,
        }) as never,
        {
          width: 1200,
          height: 630,
          fonts: [{ name: 'Newsreader', data: fontData, weight: 500, style: 'normal' }],
        },
      );
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
      return new Response(new Uint8Array(png), {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
      });
    } catch (err) {
      console.error('OG generation failed, falling back to solid PNG:', err);
    }
  }

  // Fallback: solid-color 1200x630 PNG via Sharp. Build never breaks.
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
