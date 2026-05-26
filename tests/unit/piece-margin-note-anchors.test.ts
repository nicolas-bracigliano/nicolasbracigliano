import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

// ADR 0011 + ADR 0012: every `marginNotes[i].section` in a piece's
// frontmatter must resolve to an H2 slug in that piece's body.
//
// **The orphan bug this catches:** during PR P5 the CPR piece had its
// "Cost and payoff" section removed but the matching margin-note
// frontmatter wasn't dropped. The remark plugin silently skipped the
// orphan (no error, no warning); the page just rendered with one fewer
// pull quote than the frontmatter declared. Future-me would have
// noticed the missing quote only by reading the piece end-to-end.
//
// Slug algorithm matches `src/lib/remark-inject-margin-notes.ts` —
// lowercase, strip apostrophes, non-letter/number chars become hyphens,
// trim leading/trailing hyphens. Accented letters preserved via Unicode
// property escapes (so `Por qué...` slugifies to `por-qué-...`).

const PIECES_ROOT = join(__dirname, '..', '..', 'src', 'content', 'pieces');

interface MarginNoteEntry {
  section: string;
  text: string;
}

interface PieceFrontmatter {
  marginNotes?: MarginNoteEntry[];
}

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

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: raw };
  return { frontmatter: match[1]!, body: match[2]! };
}

/** Slugify the way `remark-inject-margin-notes` does — same algorithm
 *  so the test exercises the same matching the plugin runs at build. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['‘’“”]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function extractH2Slugs(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^## (.+?)\s*$/);
    if (m) out.push(slugify(m[1]!));
  }
  return out;
}

describe('piece margin notes — every section anchor resolves to an H2', () => {
  const pieces = listPieces();
  it('finds at least one piece to scan', () => {
    expect(pieces.length).toBeGreaterThan(0);
  });

  for (const file of pieces) {
    it(`${file.replace(PIECES_ROOT, '').replace(/^\//, '')} — no orphan marginNotes anchors`, () => {
      const raw = readFileSync(file, 'utf-8');
      const { frontmatter, body } = splitFrontmatter(raw);
      const data = parseYaml(frontmatter) as PieceFrontmatter;
      const notes = data?.marginNotes ?? [];
      if (notes.length === 0) return; // piece has no margin notes, vacuous pass
      const h2Slugs = new Set(extractH2Slugs(body));
      const orphans = notes.map((n) => n.section).filter((section) => !h2Slugs.has(section));
      expect(
        orphans,
        `marginNotes[].section value(s) don't match any H2 slug in the body. ` +
          `The remark plugin will silently skip these — fix by either dropping ` +
          `the frontmatter entry or restoring the section.\n` +
          `H2 slugs found: ${[...h2Slugs].join(', ')}\n` +
          `Orphan(s): ${orphans.join(', ')}`,
      ).toEqual([]);
    });
  }
});
