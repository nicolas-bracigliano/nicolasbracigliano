import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// §6 Punctuation rule: no em dashes (`—`, U+2014) in piece body prose.
// Em dashes signal editorial flourish; the site voice is craft-bench.
// Substitute period + new sentence, comma, colon, semicolon, or
// parentheses depending on what the dash was doing.
//
// Scope: piece bodies only. Frontmatter is exempt — captions and ledes
// occasionally need an em dash for typographic flourish (e.g., the
// mastheads' eyebrow separators). Code blocks are also exempt since
// `—` can legitimately appear in code samples; we strip those before
// the scan.
//
// Enforcement: this test fails the build (exit code 1) when a piece
// body contains `—`. The §6 rule is binding — there's no advisory
// grace period for this one. Discovered violations get fixed in the
// same PR that surfaces them.

const PIECES_ROOT = join(__dirname, '..', '..', 'src', 'content', 'pieces');

function listPieces(): string[] {
  const out: string[] = [];
  for (const locale of ['en', 'es'] as const) {
    let entries: string[];
    try {
      entries = readdirSync(join(PIECES_ROOT, locale));
    } catch {
      continue;
    }
    for (const file of entries) {
      if (file.endsWith('.md')) out.push(join(PIECES_ROOT, locale, file));
    }
  }
  return out.sort();
}

/** Split frontmatter from body. Returns body only (frontmatter stripped). */
function stripFrontmatter(raw: string): string {
  // Match a leading `---\n...\n---\n` block; if absent, return raw.
  const match = raw.match(/^---\n[\s\S]*?\n---\n/);
  return match ? raw.slice(match[0].length) : raw;
}

/** Strip fenced code blocks (``` ... ```) and inline `code` so em dashes
 *  inside code samples don't trip the rule. */
function stripCode(body: string): string {
  return body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

describe('piece body — no em dashes in prose (§6 Punctuation)', () => {
  const pieces = listPieces();
  // Sanity: the test only meaningfully runs if there are pieces. If
  // the collection is empty (route shipped but empty), pass vacuously
  // rather than fail with a confusing zero-iteration assertion.
  it('finds at least one piece to scan', () => {
    expect(pieces.length, 'at least one piece in src/content/pieces/').toBeGreaterThan(0);
  });

  for (const file of pieces) {
    it(`${file.replace(PIECES_ROOT, '').replace(/^\//, '')} — no em dashes in body`, () => {
      const raw = readFileSync(file, 'utf-8');
      const body = stripCode(stripFrontmatter(raw));
      const matches = body.match(/—/g) ?? [];
      // On failure, show the surrounding context for each occurrence so
      // the fix is obvious.
      if (matches.length > 0) {
        const lines = body.split('\n');
        const offending = lines
          .map((line, i) => ({ line, i }))
          .filter(({ line }) => line.includes('—'))
          .map(({ line, i }) => `  L${i + 1}: ${line.trim()}`)
          .slice(0, 5);
        const detail = offending.join('\n');
        const more = matches.length > 5 ? `\n  …and ${matches.length - 5} more` : '';
        expect(
          matches.length,
          `Em dash in prose. Substitute period + new sentence, comma, colon, ` +
            `semicolon, or parentheses (see §6 Punctuation).\n${detail}${more}`,
        ).toBe(0);
      } else {
        expect(matches.length).toBe(0);
      }
    });
  }
});
