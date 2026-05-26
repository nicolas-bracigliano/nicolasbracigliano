import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// §6 voice rule: no banned phrases in piece body prose.
//
// The catalogue lifts the §6 list inline so the test is the source of
// truth — design-system.md cross-references back to this file. Adding
// a phrase here automatically extends the catalogue.
//
// **Enforced — this test fails the build.** The catalogue is small and
// curated, and all current pieces pass clean, so the false-positive
// risk is low. If a piece genuinely needs one of these phrases (quoting
// the term, arguing against it, a technical-term context), the fix is
// cheap: reword, switch the example, or — if truly unavoidable — add a
// per-file exemption to the BANNED_PHRASES scan with a comment. There's
// no soft-warning grace period: a unit test that never fails gives no
// CI signal, so "advisory" would mean "useless." Enforce from day one;
// loosen only if real false positives accumulate.
//
// The "round-number self-claims" rule from §6 isn't catchable with a
// static phrase list — that's a voice judgement call left to review.

const PIECES_ROOT = join(__dirname, '..', '..', 'src', 'content', 'pieces');

// Banned phrases. Lower-case; matched case-insensitively against the
// piece body after frontmatter + code strip. Word boundaries are NOT
// required for substring catches like "synergy", but the most
// common gotcha (a piece naming the banned phrase to argue AGAINST it
// — e.g. "the LinkedIn 'best practice' frame") needs case-by-case
// review. If a piece legitimately quotes one of these, work around
// the rule by paraphrasing or by switching the quote to a different
// example. The catalogue stays opinionated.
const BANNED_PHRASES = [
  'beacon of',
  'unlock',
  'transformative',
  'robust',
  'best practice',
  'industry-standard',
  'cutting-edge',
  'leverage',
  'synergy',
  '18+ years',
  'decades of experience',
] as const;

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

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n/);
  return match ? raw.slice(match[0].length) : raw;
}

function stripCode(body: string): string {
  return body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

describe('piece body — no banned phrases (§6 voice catalogue)', () => {
  const pieces = listPieces();
  it('finds at least one piece to scan', () => {
    expect(pieces.length).toBeGreaterThan(0);
  });

  for (const file of pieces) {
    it(`${file.replace(PIECES_ROOT, '').replace(/^\//, '')} — no banned phrases in body`, () => {
      const raw = readFileSync(file, 'utf-8');
      const body = stripCode(stripFrontmatter(raw)).toLowerCase();
      const hits: string[] = [];
      for (const phrase of BANNED_PHRASES) {
        if (body.includes(phrase)) {
          // Capture a snippet of context around the first occurrence to
          // make the failure actionable.
          const idx = body.indexOf(phrase);
          const start = Math.max(0, idx - 30);
          const end = Math.min(body.length, idx + phrase.length + 30);
          const snippet = body.slice(start, end).replace(/\s+/g, ' ').trim();
          hits.push(`"${phrase}" — ...${snippet}...`);
        }
      }
      expect(
        hits.length,
        `Banned phrase(s) in body — see §6 voice catalogue. Either reword or, if quoting/arguing-against, switch the example.\n${hits.map((h) => `  - ${h}`).join('\n')}`,
      ).toBe(0);
    });
  }
});
