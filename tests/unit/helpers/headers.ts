// Shared parser for Cloudflare `_headers` blocks. Extracted from
// `tests/unit/security-headers.test.ts` when a second suite
// (`cache-headers.test.ts`) needed the same parse — one implementation of
// the format beats two that can disagree about what a block boundary is.
//
// Deliberately a re-implementation of Cloudflare's parser rather than a
// dependency: the format is a handful of rules (indented `Name: value`
// lines under a path, `#` comments, blank line or non-indented line ends
// the block) and Cloudflare ships no parser as a package. Wrangler logs
// how many rules it accepted at dev/deploy startup ("Parsed N valid header
// rules"), which is the cross-check that this reading matches theirs.

import { readFileSync } from 'node:fs';

/** Parse a named block (e.g. `/*`) from a Cloudflare `_headers` file into a
 *  name->value map. Skips `#` comments and stops at the next path or a blank
 *  line — the same shape Cloudflare's own parser recognises. */
export function parseHeadersBlock(raw: string, path: string): Record<string, string> {
  const lines = raw.split('\n');
  const start = lines.findIndex((l) => l.trim() === path);
  if (start === -1) throw new Error(`block ${path} not found in _headers`);
  const block: Record<string, string> = {};
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    // End of block: a non-indented line (next path) or a blank line.
    if (line === undefined || line.trim() === '' || !/^\s/.test(line)) break;
    if (line.trim().startsWith('#')) continue; // comment
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    block[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return block;
}

/** Every path block declared in a `_headers` file, in source order. A block
 *  path is a line that is neither indented (those are header lines), blank,
 *  nor a comment. */
export function headerBlockPaths(raw: string): string[] {
  return raw
    .split('\n')
    .filter((l) => l.trim() !== '' && !/^\s/.test(l) && !l.trim().startsWith('#'))
    .map((l) => l.trim());
}

/** Read the repo's `public/_headers` once, as raw text. */
export function readHeadersFile(): string {
  return readFileSync(new URL('../../../public/_headers', import.meta.url), 'utf-8');
}
