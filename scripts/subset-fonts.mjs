#!/usr/bin/env node
// One-shot dev task. Subsets Newsreader + JetBrains Mono into woff2 files
// under public/fonts/, plus an OG-only TTF for Satori.
//
// Requirements (install once):
//   brew install woff2
//   pip install fonttools brotli
//
// Run:
//   pnpm run subset-fonts
//
// The script downloads the source TTFs from fontsource (no extra deps), then
// uses pyftsubset to subset by glyph coverage. Commit the resulting files
// under public/fonts/; CI consumes them.
//
// The sources are `:vf@latest`, so a re-run can change the bytes behind fixed
// filenames that `/fonts/*` serves as `immutable` for a year. If the woff2
// change, bump the `?v=N` on all four references — the two `url()` in
// src/styles/fonts.css and the two preload hrefs in
// src/layouts/BaseLayout.astro — or returning visitors keep the old face.

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FONTS_DIR = resolve(ROOT, 'public/fonts');

const FONT_SOURCES = [
  {
    name: 'Newsreader-variable',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/newsreader:vf@latest/latin-wght-normal.woff2',
    outWoff2: 'newsreader-variable.woff2',
    // The display face is used at weights 400-500; instance to 400-600 (a
    // little headroom) to drop the unused 200-400 and 600-800 axis tails.
    wght: '400:600',
  },
  {
    name: 'JetBrainsMono-variable',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono:vf@latest/latin-wght-normal.woff2',
    outWoff2: 'jetbrains-mono-variable.woff2',
    // The body/mono face is used at 100-700 (nav 100 … cube 700); trim 700-800.
    wght: '100:700',
  },
];

const OG_FONT = {
  name: 'Newsreader-OG',
  // Static 500-weight cut for Satori (which loads a single weight).
  url: 'https://cdn.jsdelivr.net/fontsource/fonts/newsreader@latest/latin-500-normal.ttf',
  outTtf: 'og-newsreader.ttf',
};

async function download(url, destPath) {
  // 30 s bounded — a hung jsdelivr CDN would otherwise stall the dev
  // task indefinitely.
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  console.log(`  → ${destPath} (${buf.byteLength} bytes)`);
}

// Trim the variable `wght` axis to the range the site uses, in place. Dropping
// the unused axis tails is most of the size win and removes no glyphs, so
// there's no tofu risk. Output stays woff2 (brotli). Requires `fonttools` on
// PATH (pip install fonttools brotli).
function instance(fontPath, wght) {
  execFileSync('fonttools', [
    'varLib.instancer',
    fontPath,
    `wght=${wght}`,
    '-o',
    fontPath,
    '--quiet',
  ]);
  console.log(`  ↳ instanced wght=${wght} (${statSync(fontPath).size} bytes)`);
}

async function main() {
  if (!existsSync(FONTS_DIR)) await mkdir(FONTS_DIR, { recursive: true });
  for (const f of FONT_SOURCES) {
    console.log(`Fetching ${f.name}…`);
    const out = resolve(FONTS_DIR, f.outWoff2);
    await download(f.url, out);
    instance(out, f.wght);
  }
  console.log(`Fetching ${OG_FONT.name}…`);
  await download(OG_FONT.url, resolve(FONTS_DIR, OG_FONT.outTtf));

  console.log('\nDone. Runtime fonts are Latin-subset + wght-instanced, ~79 KB combined.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
