import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

// The one piece-level check that's a TEST, not a guide item.
//
// PR V codified the voice + shape standards as a reflective writer's
// guide (design-system.md §7b), not CI gates — because "is this anecdote
// real?", "is this the wrong register?", "is 1700 words sprawl?" are
// editorial judgements a test can't make (see ADR 0011, "How this is
// applied"). This file is the deliberate exception: the margin-note
// anchor check isn't a judgement call, it's a silent CORRECTNESS bug.
//
// Every `marginNotes[i].section` must resolve to an H2 slug in the
// piece body. If it doesn't, the remark plugin
// (`src/lib/remark-inject-margin-notes.ts`) silently skips it — the
// page renders with one fewer pull quote than the frontmatter declares,
// with no error. It bit during PR P5 (the CPR "Cost and payoff" section
// was removed but the matching margin-note frontmatter wasn't dropped).
// A human reviewer catches this only by reading the rendered page end-
// to-end and counting; a test catches it in milliseconds. That's the
// line: style → §7b checklist, silent-render bug → this test.
//
// Slug algorithm mirrors the remark plugin exactly so the test
// exercises the same matching the build runs.

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
    expect(pieces.length, 'at least one piece in src/content/pieces/').toBeGreaterThan(0);
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
          `The remark plugin will silently skip these — the pull quote won't render. ` +
          `Fix by dropping the frontmatter entry or restoring/renaming the section.\n` +
          `H2 slugs found: ${[...h2Slugs].join(', ')}\n` +
          `Orphan(s): ${orphans.join(', ')}`,
      ).toEqual([]);
    });
  }
});
