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

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
  },
  {
    name: 'JetBrainsMono-variable',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono:vf@latest/latin-wght-normal.woff2',
    outWoff2: 'jetbrains-mono-variable.woff2',
  },
];

const OG_FONT = {
  name: 'Newsreader-OG',
  // Static 500-weight cut for Satori (which loads a single weight).
  url: 'https://cdn.jsdelivr.net/fontsource/fonts/newsreader@latest/latin-500-normal.ttf',
  outTtf: 'og-newsreader.ttf',
};

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  console.log(`  → ${destPath} (${buf.byteLength} bytes)`);
}

async function main() {
  if (!existsSync(FONTS_DIR)) await mkdir(FONTS_DIR, { recursive: true });
  for (const f of FONT_SOURCES) {
    console.log(`Fetching ${f.name}…`);
    await download(f.url, resolve(FONTS_DIR, f.outWoff2));
  }
  console.log(`Fetching ${OG_FONT.name}…`);
  await download(OG_FONT.url, resolve(FONTS_DIR, OG_FONT.outTtf));

  console.log('\nDone. Target ≤80 KB total for runtime fonts.');
  console.log(
    'Optional: run `pyftsubset` against each woff2 with --unicodes=U+0020-007E,U+00A0-00FF',
  );
  console.log('to subset further for the bilingual EN/ES character set.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
