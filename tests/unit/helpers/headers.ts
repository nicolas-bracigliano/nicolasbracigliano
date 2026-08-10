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
 *  map keyed by LOWERCASED header name. Use `headerValue()` to read from it
 *  rather than indexing directly, so callers can't reintroduce a
 *  case-sensitive lookup.
 *
 *  Deliberately mirrors Cloudflare's own parser, which this originally did
 *  not. Two divergences mattered and both let a real rule slip past the
 *  guards silently:
 *
 *   1. Cloudflare trims every line and lowercases header names. Keying on the
 *      verbatim spelling meant `cache-control:` (lowercase — legal, and what
 *      Cloudflare normalises to anyway) parsed into a key no assertion looked
 *      at, so `immutable` on a non-hashed path passed the guard.
 *   2. Cloudflare continues a rule past blank lines until the next path line.
 *      Breaking on the first blank line hid every header after it.
 *
 *  Indentation is irrelevant to Cloudflare, so it is irrelevant here: a line
 *  is a new block iff it parses as a path (starts with `/` or a scheme). */
export function parseHeadersBlock(raw: string, path: string): Record<string, string> {
  const lines = raw.split('\n');
  const start = lines.findIndex((l) => l.trim() === path);
  if (start === -1) throw new Error(`block ${path} not found in _headers`);
  const block: Record<string, string> = {};
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) break;
    const trimmed = line.trim();
    if (trimmed === '') continue; // blank lines do NOT end a rule
    if (trimmed.startsWith('#')) continue; // comment
    if (isBlockPath(trimmed)) break; // next rule begins
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    block[trimmed.slice(0, idx).trim().toLowerCase()] = trimmed.slice(idx + 1).trim();
  }
  return block;
}

/** Case-insensitive read of a header from a parsed block. */
export function headerValue(block: Record<string, string>, name: string): string | undefined {
  return block[name.toLowerCase()];
}

/** A `_headers` line is a rule path if it names a path or a full URL. */
function isBlockPath(trimmed: string): boolean {
  return trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed);
}

/** Every path block declared in a `_headers` file, in source order. A block
 *  path is a line that is neither indented (those are header lines), blank,
 *  nor a comment. */
export function headerBlockPaths(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#') && isBlockPath(l));
}

/** Read the repo's `public/_headers` once, as raw text. */
export function readHeadersFile(): string {
  return readFileSync(new URL('../../../public/_headers', import.meta.url), 'utf-8');
}
